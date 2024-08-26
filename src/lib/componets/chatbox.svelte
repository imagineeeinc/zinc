<script>
	import RightBox from "./rightBox.svelte";
	export let uid = ""
	import { openConnection } from "$lib/js/backend.js";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { getPubKey, getContact, contactSetSecret, contactSetKey } from "$lib/js/backend.js";
	import { generateLargePrime, generateRandBase, generateSecret} from "$lib/js/numberGen.js";

	var conn
	function send(text) {
		conn.send(text)
		document.getElementById("chat-text").value = ""
	}
	if (browser) {
		conn = openConnection(uid)
		conn.on('open', async function() {
			let contact = await getContact(uid)
			if (contact.firstTime == true) {
				let base = generateRandBase()
				let prime = generateLargePrime(16)
				let secret = generateSecret()
				let pub = (base ** secret) % prime
				//TODO: Use bigger numbers (with BigInt) and convert them to binary to be sent over the netowork 
				conn.send({type: "auth", authType: "first-time", base: base, prime: prime, pub: pub, inviteUid: getPubKey() })

				contactSetSecret(uid, secret)
				contact = await getContact(uid)
			}
			conn.on('data', async function(data) {
				if (data.type == "auth" && data.authType == "first-time-response") {
					let key = (data.pub ** contact.secret) % data.prime
					contactSetKey(uid, key)
					contact = await getContact(uid)
				}
			})

			conn.send({type: "ping", pingType: "online"})
		})
		onMount(() => {
			document.getElementById("chat-text").onkeypress = (e)=>{
				// if key is enter
				if (e.keyCode == 13) {
					send(document.getElementById("chat-text").value)
				}
			}
		})
	}
</script>

<RightBox title="Chat">
	Hi {uid}
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