<script>
	import Contacts from '$lib/componets/contacts.svelte';
	import Chatbox from '$lib/componets/chatbox.svelte';
	import P2p from '$lib/componets/p2p.svelte';
	import Create from '../lib/componets/create.svelte';
	import ScanQr from '../lib/componets/scanQr.svelte';
	import { socket } from '$lib/js/backend.js';
	import { page } from '$app/stores'

	import { Router, Route, navigate } from 'svelte-routing'
  import { onMount } from 'svelte';

	onMount(() => {
		if ($page.url.hash) {
			let interval = setInterval(() => {
				if (socket.connected) {
					navigate($page.url.hash.slice(2))
					clearInterval(interval)
				}
			}, 10)
		}
	})
</script>

<Contacts />

<Router>
  <Route path="chat/:uid" component={Chatbox} />
	<Route path="p2p" component={P2p} />
	<Route path="p2p/scan" component={ScanQr} />
	<Route path="create" component={Create} />
</Router>