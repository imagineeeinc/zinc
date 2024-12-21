<script>
	import { writable } from "svelte/store"
	import { socket } from "$lib/js/backend.js"
	let online = true
	let type = writable('info')
	let hide = writable(true)
	setInterval(() => {
		if (!socket.connected) {
			online = false
			type.set('error')
			hide.set(false)
		} else {
			online = true
			type.set('success')
			hide.set(true)
		}
	}, 1000)
</script>

<div id="bar" class="{$type} {$hide ? 'hide' : ''}">
	{online ? "Online" : "Offline"}
</div>

<style>
	#bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 20px;
		
		font-size: 15px !important;
		font-weight: 700;
		text-align: center;
		transition-duration: 1s;
	}
	.hide {
		transform: translateY(-40px);
	}
	#bar.success {
		background: var(--tertiary);
		color: black;
	}
	#bar.info {
		background: lightskyblue;
		color: black;
	}
	#bar.warn {
		background: orange;
		color: black;
	}
	#bar.error {
		background: lightcoral;
		color: black;
	}
</style>