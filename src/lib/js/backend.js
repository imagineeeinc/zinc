import * as dinoDb from 'dino-db'
import { Dexie, liveQuery } from "dexie"
import { generateRandBase, randomIntByLen } from "./numberGen.js"
import { navigate } from 'svelte-routing'
import { DateTime } from 'luxon'
import { generateUsername } from 'friendly-username-generator'
import { io } from 'socket.io-client'
import { toast } from '@zerodevx/svelte-toast'

export var rdb = new Dexie("ZincDB")
rdb.version(1).stores({
  messages: '++id, senderUid, content, timestamp, sendOrRecive',
	contacts: 'uid, name, firstTime, key, secret',
	meshStore: '++id, storeFor, packet'
})

import { browser } from "$app/environment"
import { on } from 'svelte/events'
import { writable } from 'svelte/store'

export var socket = io()
export var onNetwork = false
export let myName = writable("")
export let online = writable([])
let visible = writable(true)
function createPeer() {
	socket.emit("registerSelf", {id: getPubKey()})
	socket.emit("requestMessageFor", {id: getPubKey()})
	onNetwork = true
	socket.on('channelFrom', async (data) => {
		let packet = data.packet
		if (packet.type == "ping" && packet.pingType == "online") {
			// TODO: set online status
		}  else if (data.dispersed == true) {
			console.log(data.storeFor, packet)
			addMessageToMesh(data.storeFor, packet)
		} else if (packet.type == "auth" && packet.authType == "first-time") {
			let base = BigInt(`0b${packet.base}`)
			let prime = BigInt(`0b${packet.prime}`)
			let secret = generateRandBase()
			let pub = (base ** secret) % prime
			socket.emit('channelTo', {
				recipient: packet.senderUid,
				packet: {
					type: "auth",
					authType: "first-time-response",
					base: base.toString(2),
					prime: prime.toString(2),
					pub: pub.toString(2),
					senderUid: getPubKey()
				}
			})
			let uid = packet.senderUid
			addContactToDb(uid)
			contactSetSecret(uid, secret)
			let key = (BigInt(`0b${packet.pub}`) ** secret) % prime
			await contactSetKey(uid, key)
			let nameData = await encryptForContact(uid, getSelf().name)
			socket.emit("channelTo", {
				recipient: uid,
				packet: {
					type: "auth",
					authType: "name-exchange",
					payload: nameData.payload,
					iv: nameData.iv,
					senderUid: getPubKey()
				}
			})
			// FIXME: name exchange not happening first time
		} else if (packet.type == "auth" && packet.authType == "first-time-response") {
			let contact = await getContact(packet.senderUid)
			let key = (BigInt(`0b${packet.pub}`)** BigInt(`0b${contact.secret}`)) % BigInt(`0b${packet.prime}`)
			await contactSetKey(packet.senderUid, key)
			let nameData = await encryptForContact(packet.senderUid, getSelf().name)
			socket.emit("channelTo", {
				recipient: uid,
				packet: {
					type: "auth",
					authType: "name-exchange",
					payload: nameData.payload,
					iv: nameData.iv,
					senderUid: getPubKey()
				}
			})
		} else if (packet.type == "auth" && packet.authType == "name-exchange") {
			let name = await decryptForContact(packet.senderUid, packet.payload, packet.iv)
			updateContact(packet.senderUid, {name})
		} else if (packet.type == "chat") {
			await parseChatPacket(packet, false)
		}
	})
	socket.on('anyMessageFor', async (uid) => {
		let res = await rdb.meshStore.where("storeFor").equals(uid).toArray()
		if (res.length == 0) return
		socket.emit("messageFromMeshFor", {id: uid, packets: res})
		rdb.meshStore.where("storeFor").equals(uid).delete()
		// TODO: Get the mesh to move messages around
	})
	socket.on('messageFromMesh', async (packets) => {
		for (let packet of packets) {
			await parseChatPacket(packet.packet, true)
		}
	})
}

async function parseChatPacket(packet, fromMesh) {
	if (packet.chatType == "text") {
		await addMessageToDb(packet.senderUid, {payload: packet.payload, iv: packet.iv}, packet.time, false)
		if (!fromMesh) {
			if (!document.hasFocus()/*  || visible.get() == false */) {
				await notifyMessage(packet.senderUid, packet)
			} else if (window.location.href.split("/").pop() != packet.senderUid) {
				await toastMessage(packet.senderUid, packet)
			}
		}
	}
}
var db = new dinoDb.database({id: "zinc"})

if (browser) {
	document.addEventListener('visibilitychange', function() {
		if (document.visibilityState === 'visible') {
			visible.set(true)
		} else {
			visible.set(false)
		}
	})

	if (localStorage.getItem('db') === undefined ||
  localStorage.getItem('db') === "" ||
  localStorage.getItem('db') === null) {
		db.newBook("contacts")
		db.newBook("messages")
		db.newBook("self")

		let d = JSON.stringify(db._db)
		localStorage.setItem('db', d)
	} else {
		let d = localStorage.getItem('db')
		db._db = JSON.parse(d)
		myName.set(getSelf().name)
		myName.subscribe((value) => {
		db.updateInBook("self", "personal", {name: value})
	})
	}

	if (localStorage.getItem('zinc-self') === undefined ||
	localStorage.getItem('zinc-self') === "" ||
	localStorage.getItem('zinc-self') === null) {
		navigate("/create")
	} else {
		let settings = db.getFromBook("self", "settings")
		createPeer()
	}
	window.DEBUGnoWriteDb = false
	window.DEBUGloadFromDb = false
	setInterval(() => {
		if (!window.DEBUGnoWriteDb) {
			let d = JSON.stringify(db._db)
			localStorage.setItem('db', d)
		} else if(window.DEBUGloadFromDb) {
			let d = localStorage.getItem('db')
			db._db = JSON.parse(d)
			window.DEBUGloadFromDb = false
			window.DEBUGnoWriteDb = false
		}
	}, 100)
	setInterval(async () => {
		let contacts = await rdb.contacts
		.toArray()
		let uids = contacts.map((contact) => contact.uid)
		socket.emit("anyOnline", uids)
	}, 1000)
}
socket.on('anyOnlineResponse', (data) => {
	online.set(data)
})

export function addContactToDb(contact) {
	rdb.contacts.add({uid: contact, name: contact, firstTime: true})
}
export function deleteContact(contact) {
	rdb.contacts.delete(contact)
	rdb.messages.where("senderUid").equals(contact).delete()
}
export function removeContactFromDb(contact) {
	rdb.contacts.delete(contact)
}
export function updateContact(contact, data) {
	rdb.contacts.update(contact, data)
}
export function createAccount(name, email) {
	let u = generateUsername({useRandomNumber: false}) + "-" + randomIntByLen(6)
	localStorage.setItem('zinc-self', u)
	db.setInBook("self", "personal", {name: name, email: email})
	db.setInBook("self", "pub_key", {pub_key: u})
	createPeer()
}
export function getPubKey() {
	return localStorage.getItem('zinc-self')
}
export function getSelf() {
	return db.getFromBook("self", "personal")
}
export async function getContacts() {
	let res = rdb.contacts.toArray()
	return res
}
export async function getContact(id) {
	let res = await rdb.contacts.get(id)
	return res
}
export async function contactSetSecret(uid, secret) {
	rdb.contacts.update(uid, {secret: secret.toString(2)})
}
export async function contactSetKey(uid, key) {
	rdb.contacts.update(uid, {key: key.toString(2), firstTime: false})
}
export async function contactGetKey(uid) {
	let res = await rdb.contacts.get(uid)
	return res.key
}
export async function addMessageToDb(uid, content, timestamp, sendOrRecive) {
	let res = await rdb.messages.where({senderUid: uid, timestamp, sendOrRecive}).toArray()
	if (res.length > 0) {
		return
	}
	rdb.messages.add({senderUid: uid, content, timestamp, sendOrRecive})
}
export function addMessageToMesh(uid, packet) {
	rdb.meshStore.add({storeFor: uid, packet})
}
export async function getMessages(uid) {

	let contents = liveQuery (
		() => rdb.messages
		.where("senderUid")
		.equals(uid)
		.sortBy('timestamp')
	)
	return contents
}

let enc = new TextEncoder()
let dec = new TextDecoder()
async function getContactAesKey(uid) {
	let hashBuffer = await crypto.subtle.digest(
		'SHA-256',
		enc.encode(BigInt(`0b${await contactGetKey(uid)}`))
	)
	let hash = new Uint8Array(hashBuffer).slice(0, 16)
	return await window.crypto.subtle.importKey(
		"raw",
		hash.buffer,
		"AES-CBC",
		false,
		["encrypt", "decrypt"],
	)
}
export async function encryptForContact(uid, payload) {
	let encoded = enc.encode(payload)
	let iv = window.crypto.getRandomValues(new Uint8Array(16))
	let key_encoded = await getContactAesKey(uid)
	return {
		iv,
		payload: await window.crypto.subtle.encrypt(
			{
				name: "AES-CBC",
				iv: iv
			},
			key_encoded,
			encoded
		)
	}
}
export async function decryptForContact(uid, payload, iv) {
	let key_encoded = await getContactAesKey(uid)
	return dec.decode(await window.crypto.subtle.decrypt(
		{
			name: "AES-CBC",
			iv: iv
		},
		key_encoded,
		payload
	))
}
// async function genHashFromMessage(message) {
// 	let data = `${message.senderUid}${message.timestamp}${message.sendOrRecive}`
// 	let res = await genHashFromObj(data)
// 	return res
// }
// async function genHashFromObj(obj) {
//   const data = enc.encode(obj)
//   const hash = await window.crypto.subtle.digest("SHA-512", data)
//   const hashArray = Array.from(new Uint8Array(hash))
//   const hashHex = hashArray
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join(""); 
// 	return hashHex
// }

async function notifyMessage(uid, content) {
	if (!("Notification" in window)) {
		return
	}
	if (Notification.permission === "granted") {
		let res = await decryptForContact(uid, content.payload, content.iv)
		let contact = await getContact(uid)
		let noti = new Notification(`From ${contact.name}`, {body: res, timestamp: content.timestamp})
		noti.onclick = () => {
			navigate("/")
			navigate("/chat/" + uid)
		}
	}
}
async function toastMessage(uid, content) {
	let res = await decryptForContact(uid, content.payload, content.iv)
	let contact = await getContact(uid)
	toast.push(`<strong>${contact.name}</strong>: ${res}`, { classes: ['toast'],  pausable: true, duration: 20000 })
}

export { db }