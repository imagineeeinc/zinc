<script>
	import Contacts from '$lib/componets/contacts.svelte';
	import Chatbox from '$lib/componets/chatbox.svelte';
	import P2p from '$lib/componets/p2p.svelte';
	import Create from '../lib/componets/create.svelte';

	import { Router, Route, navigate } from 'svelte-routing'
</script>

<Contacts />

<Router>
  <Route path="chat/:uid" component={Chatbox} />
	<Route path="p2p" component={P2p} />
	<Route path="create" component={Create} />
</Router>