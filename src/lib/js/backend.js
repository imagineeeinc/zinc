import pkg from "peerjs";
const Peer = pkg;
import * as dinoDb from "dino-db"
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
	window.writeDb = true
	setInterval(() => {
		if (window.writeDb) {
			let d = JSON.stringify(db._db)
			localStorage.setItem('db', d)
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
export function openConnection(uid) {
	return peer.connect(`zinc-${uid}`)
}

export { db }