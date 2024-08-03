<script>
	import RightBox from "./rightBox.svelte";
	export let uid = ""
  // TODO: check first time and send beacon message asking name and keys
	import { openConnection } from "$lib/js/backend.js";
	import { browser } from "$app/environment";
	if (browser) {
		var conn = openConnection(uid)
		conn.on('open', function() {
			// Receive messages
			conn.on('data', function(data) {
				console.log('Received', data)
			})

			conn.send({})
		})
	}
</script>

<RightBox title="Chat">
	Hi {uid}
</RightBox>

<style>
	
</style>