<script>
	import { navigate } from "svelte-routing"
	import { getContacts, deleteContact, rdb } from "$lib/js/backend.js"
	import { liveQuery } from "dexie"
	import { get } from "svelte/store"
	let deleteMode = false
	let contacts = liveQuery (
		() => rdb.contacts
		.toArray()
	)
	function clickHandler(uid) {
		if (deleteMode) {
			if (confirm("Are you sure you want to delete this contact?")) {
				deleteContact(uid)
			}
		} else {
			navigate(`/chat/${uid}`)
		}
	}
	
</script>

<div id="contacts">
	<div id="contact-manage">
		<span>
			<button class="m-icon" title="Add or Share Contact" on:click={() => navigate("/p2p")}>person_add</button>
			<button class="m-icon" title="Search Contact">person_search</button>
			<button class="m-icon" title="Search Everything">search</button>
			<button class="m-icon {deleteMode ? "delete" : ""}" title="Delete Contact" on:click={() => deleteMode = !deleteMode}>delete</button>
			<button class="m-icon" title="Settings">settings</button>
		</span>
	</div>
	<div id="contact-list">
		{#each $contacts as contact}
			{@const uid = contact.uid}
			<div class="clickable {deleteMode ? "delete" : ""}" on:click={() => clickHandler(uid)}>
				{ contact.name || uid }
			</div>
		{/each}
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
	#contact-list > div {
		outline: 3px solid var(--bg);
		padding: 10px;
		border-radius: 10px;
	}
	#contact-list > div:hover {
		outline: 3px solid var(--tertiary);
	}
	.delete {
		color: crimson;
		outline: 3px solid crimson;
	}
	@media (max-width: 100vh) {
		#contacts {
			width: calc(100vw - 20px);
		}
	}
</style>