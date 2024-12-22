<script>
	import RightBox from "./rightBox.svelte";
	let { uid } = $props()
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { socket, getSelf, getPubKey, getContact, updateContact, contactSetSecret, contactSetKey, encryptForContact, decryptForContact, getMessages, addMessageToDb, rdb } from "$lib/js/backend.js";
	import { generateLargePrime, generateRandBase} from "$lib/js/numberGen.js";
  import { writable, get } from "svelte/store";
	import { tick } from 'svelte';
	import { DateTime } from "luxon"
	import { liveQuery } from "dexie"
	import { scrollToBottom } from "$lib/js/scroll.js";

	var contact = writable({})
	async function send(text) {
		let time = DateTime.now().toUnixInteger()
		let encrypted = await encryptForContact(get(contact).uid, text)
		// conn.send({type: "chat", chatType: "text", time, payload: encrypted.payload, iv: encrypted.iv, senderUid: getPubKey()})
		socket.emit("channelTo", {recipient: uid,
			meshDisperse: true,
			packet: {
				type: "chat",
				chatType: "text",
				time,
				payload: encrypted.payload,
				iv: encrypted.iv,
				senderUid: getPubKey()
			}
		})
		document.getElementById("chat-text").value = ""
		document.getElementById("chat-text").focus()

		addMessageToDb(uid, {payload: encrypted.payload, iv: encrypted.iv}, time, true )
	}
	function sendButton(e) {
		e.preventDefault()
		send(document.getElementById("chat-text").value)
	}
	let message = liveQuery (
		() => rdb.messages
		.where("senderUid")
		.equals(uid)
		.sortBy('timestamp')
	)
	let messagesDecrypted = writable([])
	let yScroll = writable(0)
	if (browser) {
		onMount(async () => {
			message.subscribe(async (value) => {
				let temp = []
				for (let i = 0; i < value.length; i++) {
					let m = value[i]
					let res = await decryptForContact(uid, m.content.payload, m.content.iv)
					m.payload = res
					temp.push(m)
				}
				$messagesDecrypted = temp
				tick().then(() => {
					scrollToBottom(document.getElementById("message-box"))
				})
			})
			contact.set(await getContact(uid))
			document.getElementById("chat-text").addEventListener("keypress", (e)=>{
				if (e.code == "Enter") {// e.keyCode == 13
					send(document.getElementById("chat-text").value)
				}
			})
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
				contactSetSecret(uid, secret)
				contact.set(await getContact(uid))
			} else {
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
			}
			document.getElementById("chat-text").focus()
		})
	}
</script>

<RightBox title={$contact.name}>
	<div id="message-box" on:scroll={(e) => $yScroll = e.target.scrollTop}>
		<div id="message-content">
			{#each $messagesDecrypted as m}
				<div class="message {m.sendOrRecive? 'sent': 'recieved'}">
					{m.payload}
					<span class="message-time">{DateTime.fromSeconds(m.timestamp).toFormat('dd/MM/yy t')}</span>
				</div>
			{/each}
		</div>
	</div>
	<div id="chat-form">
		<input type="text" id="chat-text" placeholder="Type a message" inputmode="text">
		<button class="m-icon" id="chat-send" on:click={sendButton}>send</button>
	</div>
</RightBox>

<style>
	#chat-form {
		display: flex;
		flex-direction: row;
		gap: 2.5px;
		justify-content: center;

		position: fixed;
		bottom: 15px;
		left: calc(30vw + 35px);
		width: calc(70vw - 55px);
	}
	#chat-send {
		width: 64px;
	}
	@media (max-width: 900px) {
		#chat-form {
			left: 15px;
			width: calc(100vw - 30px);
			bottom: 15px;
		}
	}
	#message-box {
		padding: 0;
		width: 100%;
		height: calc(100% - 60px);
		overflow-y: auto;
	}
	#message-content {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		gap: 10px;
		width: 100%;
	}
	#chat-text {
		width: 100%;
	}
	.message {
		display: inline-block;
		background: var(--secondary);
		padding: 10px;
		border-radius: 10px;
		max-width: 60%;
	}
	.message-time {
		font-size: x-small;
		display: block;
	}
	.recieved {
		text-align: left;
		align-self: flex-start;
	}
	.sent {
		text-align: right;
		align-self: flex-end;
	}
</style>