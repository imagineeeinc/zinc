<script>
	import RightBox from "./rightBox.svelte";
	import QrScanner from 'qr-scanner'
	import { onMount } from 'svelte'
	import { addContactToDb } from "$lib/js/backend.js";
  import { navigate } from "svelte-routing";
	var qrScanner = null
	function resultHandler(result) {
		addContactToDb(result.data)
		qrScanner.destroy()
		navigate("/")
	}
	onMount(async () => {
		qrScanner = new QrScanner(
			document.getElementById('preview'),
			resultHandler,
			{ preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true },
		)
		qrScanner.start()
	})
</script>

<RightBox title="Scan QR Code">
	<div id="qr-content">
		<video id="preview"></video>
	</div>
</RightBox>

<style>
	#qr-content {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 10px;
		justify-content: center;
		align-items: center;
	}
	#preview {
		width: 100%;
		height: 100%;
		border-radius: 20px;
	}
</style>
