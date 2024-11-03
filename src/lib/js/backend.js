import pkg from "peerjs";
const Peer = pkg;
import * as dinoDb from "dino-db"
import { Dexie, liveQuery } from "dexie"
import { generateRandBase } from "./numberGen.js"
import { navigate } from "svelte-routing";
import { DateTime } from "luxon"
import { io } from 'socket.io-client'

export var messages = new Dexie("messages")
messages.version(1).stores({
  messages: '++id, senderUid, content, timestamp, sendOrRecive'
})

import { browser } from "$app/environment"
var peer = null
export var socket = io()
function createPeer(name, relay, port) {
	/* peer = new Peer(`zinc-${name}`, {
		host: relay || "0.peerjs.com",
		port: port || 443
	})
	peer.on('connection', function(conn) {
		// Receive messages
		conn.on('data', async function(data) {
			console.log('Received', data)
			if (data.type == "ping" && data.pingType == "online") {
				// TODO: set online status
			} else if (data.type == "auth" && data.authType == "first-time") {
				let base = BigInt(`0b${data.base}`)
				let prime = BigInt(`0b${data.prime}`)
				let secret = generateRandBase()
				let pub = (base ** secret) % prime
				conn.send({type: "auth", authType: "first-time-response", base: base.toString(2), prime: prime.toString(2), pub: pub.toString(2)})
				
				let uid = data.senderUid
				addContactToDb(uid)
				contactSetSecret(uid, secret)
				let key = (BigInt(`0b${data.pub}`) ** secret) % prime
				contactSetKey(uid, key)
				let nameData = await encryptForContact(uid, getSelf().name)
				conn.send({type: "auth", authType: "name-exchange", payload: nameData.payload, iv: nameData.iv, senderUid: uid })
			} else if (data.type == "auth" && data.authType == "name-exchange") {
				let name = await decryptForContact(data.senderUid, data.payload, data.iv)
				updateContact(data.senderUid, {name})
			} else if (data.type == "chat") {
				if (data.chatType == "text") {
					addMessageToDb(data.senderUid, {payload: data.payload, iv: data.iv}, data.time, false)
				}
			}
		})
		// Send messages
		
	})*/
	socket.emit("registerSelf", {id: getPubKey()})
	socket.on('channelFrom', async (data) => {
		let packet = data.packet
		if (packet.type == "ping" && packet.pingType == "online") {
			// TODO: set online status
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
			console.log(key)
			contactSetKey(uid, key)
			let nameData = encryptForContact(uid, getSelf().name)
			socket.emit('channelTo', {
				recipient: packet.senderUid,
				packet: {
					type: "auth",
					authType: "name-exchange",
					payload: nameData.payload,
					iv: nameData.iv,
					senderUid: getPubKey()
				}
			})
			// FIXEME: name exchange not happening first time
		} else if (packet.type == "auth" && packet.authType == "first-time-response") {
			let key = (BigInt(`0b${packet.pub}`)** BigInt(`0b${getContact(packet.senderUid).secret}`)) % BigInt(`0b${packet.prime}`)
			contactSetKey(packet.senderUid, key)
		} else if (packet.type == "auth" && packet.authType == "name-exchange") {
			let name = await decryptForContact(packet.senderUid, packet.payload, packet.iv)
			updateContact(packet.senderUid, {name})
		} else if (packet.type == "chat") {
			if (packet.chatType == "text") {
				addMessageToDb(packet.senderUid, {payload: packet.payload, iv: packet.iv}, packet.time, false)
			}
		}
	})
}
var db = new dinoDb.database({id: "zinc"})

if (browser) {
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
	}
	if (localStorage.getItem('zinc-self') === undefined ||
	localStorage.getItem('zinc-self') === "" ||
	localStorage.getItem('zinc-self') === null) {
		navigate("/create")
	} else {
		let settings = db.getFromBook("self", "settings")
		createPeer(localStorage.getItem('zinc-self'), settings.relay, settings.port)
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
}

export function addContactToDb(contact) {
	db.setInBook("contacts", contact, {uid: contact, name: contact, firstTime: true})
}
export function removeContactFromDb(contact) {
	db.deleteBook("contacts", contact)
}
export function updateContact(contact, data) {
	db.updateInBook("contacts", contact, data)
}
export function createAccount(name, relay, port) {
	let u = self.crypto.randomUUID()
	localStorage.setItem('zinc-self', u)
	db.setInBook("self", "personal", {name: name})
	db.setInBook("self", "pub_key", {pub_key: u})
	db.setInBook("self", "settings", {relay: relay, port: port})
	createPeer(name, relay, port)
}
export function getPubKey() {
	return localStorage.getItem('zinc-self')
}
export function getSelf() {
	return db.getFromBook("self", "personal")
}
export async function getContacts() {
	return db.getFullBook("contacts")
}
export function getContact(id) {
	return db.getFromBook("contacts", id)
}
export async function contactSetSecret(uid, secret) {
	db.updateInBook("contacts", uid, {secret: secret.toString(2)})
}
export async function contactSetKey(uid, key) {
	db.updateInBook("contacts", uid, {key: key.toString(2), firstTime: false})
}
export async function contactGetKey(uid) {
	return db.getFromBook("contacts", uid).key
}
export function openConnection(uid) {
	//return peer.connect(`zinc-${uid}`)
}
function createMessageStore(uid) {
	db.setInBook("messages", uid, {messages: []})
}
export function addMessageToDb(uid, content, timestamp, sendOrRecive) {
	// let d = db.getFromBook("messages", uid)
	// if (d == undefined) {
	// 	createMessageStore(uid)
	// }
	// d.messages.push(message)
	// db.setInBook("messages", uid, {messages: d.messages})
	messages.messages.add({senderUid: uid, content, timestamp, sendOrRecive: sendOrRecive})
}
export async function getMessages(uid) {
	let contents = await messages.messages
		.where("senderUid")
		.equals(uid)
		.sortBy('timestamp')

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

export { db }