<script>
	import RightBox from "./rightBox.svelte";
	export let uid = ""
	import { openConnection } from "$lib/js/backend.js";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { socket, getSelf, getPubKey, getContact, updateContact, contactSetSecret, contactSetKey, encryptForContact, decryptForContact, getMessages, addMessageToDb } from "$lib/js/backend.js";
	import { generateLargePrime, generateRandBase} from "$lib/js/numberGen.js";
  import { writable, get } from "svelte/store";
	import { DateTime } from "luxon"
	import { liveQuery } from "dexie"

	var conn
	var contact = writable({})
	async function send(text) {
		let time = DateTime.now().toUnixInteger()
		let encrypted = await encryptForContact(get(contact).uid, text)
		conn.send({type: "chat", chatType: "text", time, payload: encrypted.payload, iv: encrypted.iv, senderUid: getPubKey()})
		document.getElementById("chat-text").value = ""

		addMessageToDb(uid, {payload: encrypted.payload, iv: encrypted.iv}, time, true )
	}
	let message
	if (browser) {
		onMount(async () => {
			message = await getMessages(uid)
			contact.set(await getContact(uid))
			document.getElementById("chat-text").addEventListener("keypress", (e)=>{
				if (e.code == "Enter") {
					send(document.getElementById("chat-text").value)
				}
			})

			/* conn = openConnection(uid)
			conn.on('open', async function() {
				if (contact.firstTime == true) {
					let base = generateRandBase()
					let prime = generateLargePrime(24)
					let secret = generateRandBase()
					let pub = (base ** secret) % prime
					conn.send({type: "auth", authType: "first-time", base: base.toString(2), prime: prime.toString(2), pub: pub.toString(2), senderUid: getPubKey() })

					contactSetSecret(uid, secret)
					contact.set(await getContact(uid))
				} else {
					let nameData = await encryptForContact(uid, getSelf().name)
					conn.send({type: "auth", authType: "name-exchange", payload: nameData.payload, iv: nameData.iv, senderUid: getPubKey() })
				}
				conn.on('data', async function(data) {
					if (data.type == "auth" && data.authType == "first-time-response") {
						let key = (BigInt(`0b${data.pub}`)** BigInt(`0b${contact.secret}`)) % BigInt(`0b${data.prime}`)
						contactSetKey(uid, key)
						contact.set(await getContact(uid))
						let nameData = await encryptForContact(uid, getSelf().name)
						conn.send({type: "auth", authType: "name-exchange", payload: nameData.payload, iv: nameData.iv, senderUid: getPubKey() })
					} else if (data.type == "auth" && data.authType == "name-exchange") {
						let name = await decryptForContact(data.senderUid, data.payload, data.iv)
						updateContact(data.senderUid, {name})
						contact.set(await getContact(data.senderUid))
					}
				})

				conn.send({type: "ping", pingType: "online"})
			}) */
			if ($contact.firstTime == true) {
				let base = generateRandBase()
				let prime = generateLargePrime(24)
				let secret = generateRandBase()
				let pub = (base ** secret) % prime
				socket.emit("channelTo", {recipient: uid,
					packet: {
						type: "auth",
						authType: "first-time",
						base: base.toString(2),
						prime: prime.toString(2),
						pub: pub.toString(2),
						senderUid: getPubKey()
					}
				})
				// FIXME: key not being set
				contactSetSecret(uid, secret)
				contact.set(await getContact(uid))
				socket.on("channelFrom", async (data) => {
					if (data.type == "auth" && data.authType == "first-time-response") {
						let key = (BigInt(`0b${data.pub}`)** BigInt(`0b${contact.secret}`)) % BigInt(`0b${data.prime}`)
						contactSetKey(uid, key)
						contact.set(await getContact(uid))
						let nameData = await encryptForContact(uid, getSelf().name)
						socket.emit("channelTo", {recipient: uid,
							packet: {
								type: "auth",
								authType: "name-exchange",
								payload: nameData.payload,
								iv: nameData.iv,
								senderUid: getPubKey()
							}
						})
					}
				})
			} else {
				let nameData = await encryptForContact(uid, getSelf().name)
				socket.emit("channelTo", {recipient: uid,
					packet: {
						type: "auth",
						authType: "name-exchange",
						payload: nameData.payload,
						iv: nameData.iv,
						senderUid: getPubKey()
					}
				})
			}
		})
	}
</script>

<RightBox title={$contact.name}>
	Hi {$contact.name}
	{#each message as m}
		<div class="message">
			{#await decryptForContact(uid, m.content.payload, m.content.iv)}
				Loading...
			{:then payload}
			<!--TODO: FIX TIME-->
				{payload} {new DateTime({zone: 'local'}).fromSeconds(m.timestamp).toFormat('yyyy-MM-dd t')}
			{/await}
		</div>
	{/each}
	<div id="chat-form">
		<input type="text" id="chat-text" placeholder="Type a message">
		<button class="m-icon" on:click={()=>send(document.getElementById("chat-text").value)}>send</button>
	</div>
</RightBox>

<style>
	#chat-form {
		display: flex;
		flex-direction: row;
		gap: 10px;
		justify-content: center;

		position: fixed;
		bottom: 20px;
		left: calc(30vw + 30px);
		width: calc(70vw - 50px);
	}
	@media (max-width: 100vh) {
		#chat-form {
			left: 20px;
			width: calc(100vw - 40px);
			bottom: 20px;
		}
	}
	#chat-text {
		width: 100%;
	}
</style>