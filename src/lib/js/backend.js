import pkg from "peerjs";
const Peer = pkg;
import * as dinoDb from "dino-db"
import { generateSecret } from "./numberGen.js"
import { navigate } from "svelte-routing";

import { browser } from "$app/environment"
var peer = null
function createPeer(name, relay, port) {
	peer = new Peer(`zinc-${name}`, {
		host: relay || "0.peerjs.com",
		port: port || 443
	})
	peer.on('connection', function(conn) {
		// Receive messages
		conn.on('data', function(data) {
			if (data.type == "ping" && data.pingType == "online") {
				// TODO: set online status
			} else if (data.type == "auth" && data.authType == "first-time") {
				let base = data.base
				let prime = data.prime
				let secret = generateSecret()
				let pub = (base ** secret) % prime
				conn.send({type: "auth", authType: "first-time-response", base: base, prime: prime, pub: pub})
				
				let uid = data.inviteUid
				addContactToDb(uid)
				contactSetSecret(uid, secret)
				let key = (data.pub ** secret) % prime
				contactSetKey(uid, key)
			}
			console.log('Received', data)
		});
	
		// Send messages
		
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
export async function getContacts() {
	return db.getFullBook("contacts")
}
export async function getContact(id) {
	return db.getFromBook("contacts", id)
}
export async function contactSetSecret(uid, secret) {
	db.updateInBook("contacts", uid, {secret: secret})
}
export async function contactSetKey(uid, key) {
	db.updateInBook("contacts", uid, {key: key, firstTime: false})
}
export function openConnection(uid) {
	return peer.connect(`zinc-${uid}`)
}

export { db }