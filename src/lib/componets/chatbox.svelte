<script>
	import RightBox from "./rightBox.svelte";
	let { uid } = $props()
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { socket, getSelf, getPubKey, getContact, contactSetSecret, encryptForContact, decryptForContact, addMessageToDb, rdb, toBase64, online } from "$lib/js/backend.js";
	import { generateLargePrime, generateRandBase} from "$lib/js/numberGen.js";
	import { writable, get } from "svelte/store";
	import { tick } from 'svelte';
	import { DateTime } from "luxon"
	import { liveQuery } from "dexie"
	import { scrollToBottom } from "$lib/js/scroll.js"

	var contact = writable({})
	var files = writable([])
	// Send Message
	async function send(text, filesList) {
		console.log(files)
		let time = DateTime.now().toUnixInteger()
		let data = {
			text,
			files: JSON.parse(JSON.stringify(filesList))
		}
		// Encrypt
		let encrypted = await encryptForContact(get(contact).uid, JSON.stringify(data))
		// Send
		socket.emit("channelTo", {recipient: uid,
			meshDisperse: true,
			packet: {
				type: "chat",
				time,
				payload: encrypted.payload,
				iv: encrypted.iv,
				senderUid: getPubKey()
			}
		})
		// Reset Input
		document.getElementById("chat-text").value = ""
		files.set([])
		document.getElementById("chat-text").focus()
		// Add message to local db
		await addMessageToDb(uid, {payload: encrypted.payload, iv: encrypted.iv}, time, true )
	}
	function sendButton(e) {
		e.preventDefault()
		send(document.getElementById("chat-text").value, get(files))
	}
	// Reactive Message Recive
	let message = liveQuery (
		() => rdb.messages
		.where("senderUid")
		.equals(uid)
		.sortBy('timestamp')
	)
	let messagesDecrypted = writable([])
	let yScroll = writable(0)

	// Send Name
	async function sendName() {
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
			// Get contact info from DB
			contact.set(await getContact(uid))
			document.getElementById("chat-text").addEventListener("keypress", (e)=>{
				if (e.code == "Enter") {// e.keyCode == 13
					send(document.getElementById("chat-text").value, get(files))
				}
			})
			// Generate Keys using Diffe-Hellman
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
				setTimeout(async () => {
					await sendName()
				}, 1000)
			} else {
				await sendName()
			}
			document.getElementById("chat-text").focus()
		})
	}
	// |Extract files from file picker
	async function putFiles(e) {
		let data = []
		for (let i = 0; i < e.target.files.length; i++) {
			let res = await toBase64(e.target.files[i])
			
			data.push([e.target.files[i].name, res, e.target.files[i].type])
		}
		$files = data
	}
</script>

<RightBox title={$contact.name}>
	<div id="message-box" onscroll={(e) => $yScroll = e.target.scrollTop}>
		<div id="message-content">
			{#each $messagesDecrypted as m}
			{@const payload = JSON.parse(m.payload)}
				<div class="message {m.sendOrRecive? 'sent': 'recieved'}">
					{payload.text}
					{#if payload.files.length > 0}
						<br>
						{#each payload.files as file}
								{#if file[2].search("image") > -1}
									<img src={file[1]} class="receiving-file" alt={file[0]}>
								{:else}
									{#if file[2].search("video") > -1}
										<video src={file[1]} class="receiving-file" controls="true"></video>
									{:else}
										<a class="file" href={file[1]} download={file[0]}>
											{file[0]}
										</a>
									{/if}
								{/if}
							<br>
						{/each}
					{/if}
					<span class="message-time">{DateTime.fromSeconds(m.timestamp).toFormat('dd/MM/yy t')}</span>
				</div>
			{/each}
		</div>
	</div>
	<div id="chat-form">
		<input type="text" id="chat-text" placeholder="Type a message" inputmode="text">
		<button class="m-icon {$files.length > 0 ? "files-selected" : ""}" id="chat-attach" onclick={()=>document.getElementById('attach').click()}>attach_file</button>
		<button class="m-icon {$online.indexOf(uid) > -1 ? "online" : ""}" id="chat-send" onclick={sendButton}>send</button>
		<input type="file" id="attach" multiple onchange={putFiles}>
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
	#attach {
		display: none;
	}
	.files-selected {
		outline: 3px solid var(--tertiary);
	}
	.online {
		outline: 3px solid springgreen;
	}
	.receiving-file {
		max-width: 100%;
		border-radius: 10px;
	}
</style>