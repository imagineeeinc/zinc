<script>
	import { navigate } from "svelte-routing";
	import { getContacts } from "$lib/js/backend.js";
</script>

<div id="contacts">
	<div id="contact-manage">
		<span>
			<button class="m-icon" title="Add or Share Contact" on:click={() => navigate("/p2p")}>p2p</button>
			<button class="m-icon" title="Search Contact">person_search</button>
			<button class="m-icon" title="Search Everything">search</button>
			<button class="m-icon" title="Delete Contact">delete</button>
			<button class="m-icon" title="Settings">settings</button>
		</span>
	</div>
	<div id="contact-list">
		{#await getContacts() then contacts}
			{#each Object.keys(contacts) as uid}
				<div class="clickable" on:click={() => navigate(`/chat/${uid}`)}>
					{ contacts[uid].name || uid }
				</div>
			{/each}
		{/await}
	</div>
</div>

<style>
	#contacts {
		display: flex;
		flex-direction: column;
		gap: 10px;

		width: 30vw;
		height: calc(100% - 20px);
		padding: 10px;
	}
	#contact-manage {
		background: var(--secondary);
		padding: 10px;
		border-radius: 10px;
	}
	#contact-list {
		display: flex;
		flex-direction: column;
		gap: 10px;

		background: var(--secondary);
		padding: 10px;
		border-radius: 10px;

		overflow-y: auto;
		height: 100%;
	}
	#contacts > div > div {
		outline: 3px solid var(--bg);
		padding: 10px;
		border-radius: 10px;
	}
	#contacts > div > div:hover {
		outline: 3px solid var(--tertiary);
	}
	@media (max-width: 100vh) {
		#contacts {
			width: calc(100vw - 20px);
		}
	}
</style>