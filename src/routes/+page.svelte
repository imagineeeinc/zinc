<script>
	import Contacts from '$lib/componets/contacts.svelte';
	import Chatbox from '$lib/componets/chatbox.svelte';
	import P2p from '$lib/componets/p2p.svelte';
	import Create from '$lib/componets/create.svelte';
	import ScanQr from '$lib/componets/scanQr.svelte';
	import StatusBar from '$lib/componets/statusBar.svelte';
	import Settings from '$lib/componets/settings.svelte';
	import { onNetwork } from '$lib/js/backend.js';
	import { page } from '$app/stores'

	import { SvelteToast } from '@zerodevx/svelte-toast'

	import { Router, Route, navigate } from 'svelte-routing'
  import { onMount } from 'svelte';

	onMount(() => {
		// Handle redirect from hash
		if ($page.url.hash) {
			let interval = setInterval(() => {
				if (onNetwork) {
					navigate($page.url.hash.slice(2))
					clearInterval(interval)
				}
			}, 10)
		}
	})
</script>

<StatusBar />

<Contacts />

<Router>
  <Route path="chat/:uid" component={Chatbox} />
	<Route path="p2p" component={P2p} />
	<Route path="p2p/scan" component={ScanQr} />
	<Route path="create" component={Create} />
	<Route path="settings" component={Settings}	/>
</Router>

<SvelteToast />	

<style>
	:root {
		--toastContainerTop: calc(env(titlebar-area-height, 0px) + 20px);
    --toastContainerRight: 10px;
	}
	:global(.toast) {
    --toastBackground: var(--bg);
		--toastColor: var(--color);
    --toastBarHeight: 0;
		--toastBorderRadius: 10px;
		--toastBorder: 5px solid var(--secondary);
  }
</style>