<script>
	import RightBox from "./rightBox.svelte";
	let mode = 0
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { navigate } from "svelte-routing";
	import QR from '@svelte-put/qr/svg/QR.svelte';
	import { addContactToDb, getPubKey } from "$lib/js/backend.js";

	function addContact(uid) {
		addContactToDb(uid)
		navigate("/")
	}
	const generateQR = async text => {
		try {
			return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H' })
		} catch (err) {
			console.error(err)
		}
	}
	if (browser) {
		onMount(() => {
			document.getElementById("add-contact").onsubmit = (e)=>{
				e.preventDefault()
				addContact(document.getElementById("p2p-uid").value)
				return false
			}
		})
	}
</script>

<RightBox title="Add or Share Contact">
	<div id="p2p-tabs">
		<button class="f-b" on:click={()=>mode=0}>Add Contact</button>
		<button class="f-b" on:click={()=>mode=1}>Share Contact</button>
	</div>
	<div id="p2p-content">
		{#if mode == 0}
			<div class="f-b">Add Contact</div>
			<form id="add-contact">
				<input type="text" id="p2p-uid" placeholder="UID">
				<button class="m-icon" on:click={()=>addContact(document.getElementById("p2p-uid").value)}>person_add</button>
			</form>
		{:else if mode == 1}
			<div class="f-b">Share Contact</div>
			<QR data={getPubKey()} errorCorrectionLevel="H" width="40vh" />
			<div>Scan this QR Code, or share the code bellow</div>
			<div class="f-b" id="pub-key">{getPubKey()}</div>
		{/if}
	</div>
</RightBox>

<style>
	#p2p-tabs {
		display: flex;
		flex-direction: row;
		gap: 10px;
		justify-content: center;
	}
	#p2p-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;

		background: var(--secondary);
		border-radius: 10px;
		padding: 10px;
		height: 100%;
	}
	#pub-key {
		outline: 3px solid var(--tertiary);
		padding: 10px;
		border-radius: 10px;
	}
</style>