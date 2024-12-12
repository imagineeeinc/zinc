<script>
	import { redirect } from '@sveltejs/kit'
	import { page } from '$app/stores'

	throw redirect(303, `/#${$page.url.pathname}`)
</script>