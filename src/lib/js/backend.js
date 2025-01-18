import * as dinoDb from 'dino-db'
import { Dexie, liveQuery } from "dexie"
import { generateRandBase, randomIntByLen } from "./numberGen.js"
import { navigate } from 'svelte-routing'
import { DateTime } from 'luxon'
import { generateUsername } from 'friendly-username-generator'
import { io } from 'socket.io-client'
import { toast } from '@zerodevx/svelte-toast'
import { browser } from "$app/environment"
import { writable } from 'svelte/store'

// Init database
export var rdb = new Dexie("ZincDB")
rdb.version(1).stores({
  messages: '++id, senderUid, content, timestamp, sendOrRecive',
	contacts: 'uid, name, firstTime, key, secret',
	meshStore: '++id, storeFor, packet'
})

// Init netowork
export var socket = io()
// Init variables
export var onNetwork = false
export let myName = writable("")
export let online = writable([])
let visible = writable(true)
// Init network manager
function createPeer() {
	socket.emit("registerSelf", {id: getPubKey()})
	socket.emit("requestMessageFor", {id: getPubKey()})
	onNetwork = true
	socket.on('channelFrom', async (data) => {
		let packet = data.packet
		if (data.dispersed == true) {
			// Add to mesh
			addMessageToMesh(data.storeFor, packet)
		} else if (packet.type == "auth" && packet.authType == "first-time") {
			// Generate keys
			let base = BigInt(`0b${packet.base}`)
			let prime = BigInt(`0b${packet.prime}`)
			let secret = generateRandBase()
			let pub = (base ** secret) % prime
			// Send keys
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
			// Add contact
			let uid = packet.senderUid
			addContactToDb(uid)
			contactSetSecret(uid, secret)
			let key = (BigInt(`0b${packet.pub}`) ** secret) % prime
			// Set key
			await contactSetKey(uid, key)
			let nameData = await encryptForContact(uid, getSelf().name)
			// Send name
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
			// Set key from response
			let contact = await getContact(packet.senderUid)
			let key = (BigInt(`0b${packet.pub}`)** BigInt(`0b${contact.secret}`)) % BigInt(`0b${packet.prime}`)
			await contactSetKey(packet.senderUid, key)
			let nameData = await encryptForContact(packet.senderUid, getSelf().name)
			// Send name
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
			// Set name on recive
			let name = await decryptForContact(packet.senderUid, packet.payload, packet.iv)
			updateContact(packet.senderUid, {name})
		} else if (packet.type == "chat") {
			// recive message
			await parseChatPacket(packet, false)
		}
	})
	// Request for mesh message
	socket.on('anyMessageFor', async (uid) => {
		let res = await rdb.meshStore.where("storeFor").equals(uid).toArray()
		if (res.length == 0) return
		// Send any message
		socket.emit("messageFromMeshFor", {id: uid, packets: res})
		rdb.meshStore.where("storeFor").equals(uid).delete()
	})
	// Recive from mesh
	socket.on('messageFromMesh', async (packets) => {
		for (let packet of packets) {
			await parseChatPacket(packet.packet, true)
		}
	})
}

// Parse chat packet
async function parseChatPacket(packet, fromMesh) {
	// Add to local DB
	await addMessageToDb(packet.senderUid, {payload: packet.payload, iv: packet.iv}, packet.time, false)
	if (!fromMesh) {
		if (!document.hasFocus()/*  || visible.get() == false */) {
			// Send notification
			await notifyMessage(packet.senderUid, packet)
		} else if (window.location.href.split("/").pop() != packet.senderUid) {
			// Send toast
			await toastMessage(packet.senderUid, packet)
		}
	}
}
// Init small db
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
	// Debug flags
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
	// Check if contacts are online
	setInterval(async () => {
		let contacts = await rdb.contacts
		.toArray()
		let uids = contacts.map((contact) => contact.uid)
		socket.emit("anyOnline", uids)
	}, 5000)
}
socket.on('anyOnlineResponse', (data) => {
	online.set(data)
})

// Add Contact
export function addContactToDb(contact) {
	rdb.contacts.add({uid: contact, name: contact, firstTime: true})
}
// Delete Contact
export function deleteContact(contact) {
	rdb.contacts.delete(contact)
	rdb.messages.where("senderUid").equals(contact).delete()
}
// Update Contact
export function updateContact(contact, data) {
	rdb.contacts.update(contact, data)
}
// Create Account
export function createAccount(name, email) {
	let u = generateUsername({useRandomNumber: false}) + "-" + randomIntByLen(6)
	localStorage.setItem('zinc-self', u)
	db.setInBook("self", "personal", {name: name, email: email})
	db.setInBook("self", "pub_key", {pub_key: u})
	createPeer()
}
// Get self public key
export function getPubKey() {
	return localStorage.getItem('zinc-self')
}
// Get self info
export function getSelf() {
	return db.getFromBook("self", "personal")
}
// Get contact info
export async function getContact(id) {
	let res = await rdb.contacts.get(id)
	return res
}
// Set contact secret
export async function contactSetSecret(uid, secret) {
	rdb.contacts.update(uid, {secret: secret.toString(2)})
}
// Set contact key
export async function contactSetKey(uid, key) {
	rdb.contacts.update(uid, {key: key.toString(2), firstTime: false})
}
// Get contact key
export async function contactGetKey(uid) {
	let res = await rdb.contacts.get(uid)
	return res.key
}
// Add message to DB
export async function addMessageToDb(uid, content, timestamp, sendOrRecive) {
	let res = await rdb.messages.where({senderUid: uid, timestamp, sendOrRecive}).toArray()
	// If message already exists, skip (usefull for mesh)
	if (res.length > 0) {
		return
	}
	rdb.messages.add({senderUid: uid, content, timestamp, sendOrRecive})
}
// Add message to mesh store
export function addMessageToMesh(uid, packet) {
	rdb.meshStore.add({storeFor: uid, packet})
}

let enc = new TextEncoder()
let dec = new TextDecoder()
// Get contact aes key
async function getContactAesKey(uid) {
	// convert key to hash
	let hashBuffer = await crypto.subtle.digest(
		'SHA-256',
		enc.encode(BigInt(`0b${await contactGetKey(uid)}`))
	)
	// create 16 byte hash
	let hash = new Uint8Array(hashBuffer).slice(0, 16)
	// create key
	return await window.crypto.subtle.importKey(
		"raw",
		hash.buffer,
		"AES-CBC",
		false,
		["encrypt", "decrypt"],
	)
}
// Encrypt
export async function encryptForContact(uid, payload) {
	// convert payload to bytes
	let encoded = enc.encode(payload)
	// generate random iv
	let iv = window.crypto.getRandomValues(new Uint8Array(16))
	// get key
	let key_encoded = await getContactAesKey(uid)
	// encrypt
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
// Decrypt
export async function decryptForContact(uid, payload, iv) {
	// get key
	let key_encoded = await getContactAesKey(uid)
	// decrypt
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

// Notify
async function notifyMessage(uid, content) {
	if (!("Notification" in window)) {
		return
	}
	if (Notification.permission === "granted") {
		// Decrypt
		let res = await decryptForContact(uid, content.payload, content.iv)
		res = JSON.parse(res)
		let contact = await getContact(uid)
		// Export file info
		let files = res.files
		let fileName = files.map((f) => f[0])
		let image = files[0][2].search("image") > -1 ? files[0][1] : ""
		// Generate body text
		let body = res.text ? res.text : `Attached ${fileName.join(", ")}`
		// Notify
		let noti = new Notification(`From ${contact.name}`, {
			body,
			timestamp: content.timestamp,
			image,
			data: {
				url: "/chat/" + uid,
				status: "open"
			}
		})
		// On clicking of notification
		noti.onclick = () => {
			navigate("/")
			navigate("/chat/" + uid)
		}
	}
}
// Toast
async function toastMessage(uid, content) {
	// Decrypt
	let res = await decryptForContact(uid, content.payload, content.iv)
	res = JSON.parse(res)
	let contact = await getContact(uid)
	// Export file info
	let files = res.files
	let fileName = files.map((f) => f[0])
	// Generate body text
	let body = res.text ? res.text : `Attached ${fileName.join(", ")}`
	// Send toast
	toast.push(`<strong>${contact.name}</strong>: ${body}`, { classes: ['toast'],  pausable: true, duration: 20000 })
}

// Convert file to base64
export const toBase64 = file => new Promise((resolve, reject) => {
	const reader = new FileReader()
	reader.readAsDataURL(file)
	reader.onload = () => resolve(reader.result)
	reader.onerror = reject
})

export { db }