<script context="module">
	export let online = writable(true)
	export let type = writable('')
	export let hide = writable(true)
</script>

<script>
	import { writable } from "svelte/store"
	import { socket } from "$lib/js/backend.js"
	setInterval(() => {
		if (!socket.connected) {
			online.set(false)
			type.set('error')
			hide.set(false)
		} else {
			online.set(true)
			type.set('')
			hide.set(true)
		}
	}, 1000)
</script>

<div id="bar" class="{$type}">
	{$hide ? '' : $online ? "Online" : "Offline"}
</div>

<style>
	#bar {
		position: fixed;
		top:  env(titlebar-area-y, 0);
		left: env(titlebar-area-x, 0);
		width: 100vw;
		height: env(titlebar-area-height, 20px);
		
		font-size: 15px !important;
		font-weight: 700;
		display: flex;
    justify-content: center;
    align-items: center;

		-webkit-app-region: drag;
		app-region: drag;
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