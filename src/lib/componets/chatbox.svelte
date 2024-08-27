<script>
	import RightBox from "./rightBox.svelte";
	export let uid = ""
	import { openConnection } from "$lib/js/backend.js";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { getSelf, getPubKey, getContact, updateContact, contactSetSecret, contactSetKey, encryptForContact, decryptForContact } from "$lib/js/backend.js";
	import { generateLargePrime, generateRandBase} from "$lib/js/numberGen.js";
  import { writable } from "svelte/store";

	var conn
	var contact = writable({})
	function send(text) {
		conn.send(text)
		document.getElementById("chat-text").value = ""
	}
	if (browser) {
		onMount(async () => {
			contact.set(await getContact(uid))
			document.getElementById("chat-text").addEventListener("keypress", (e)=>{
				if (e.code == "Enter") {
					send(document.getElementById("chat-text").value)
				}
			})

			conn = openConnection(uid)
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
			})
		})
	}
</script>

<RightBox title={$contact.name}>
	Hi {$contact.name}
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