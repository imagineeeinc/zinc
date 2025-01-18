<script>
	import { navigate } from "svelte-routing"
	import { deleteContact, rdb, online } from "$lib/js/backend.js"
	import { liveQuery } from "dexie"
	let deleteMode = false
	// Reactive Contact Recive
	let contacts = liveQuery (
		() => rdb.contacts
		.toArray()
	)
	// Handle clicking a contact
	function clickHandler(uid, firstTime) {
		if (deleteMode) {
			// Delete contact
			if (confirm("Are you sure you want to delete this contact?")) {
				deleteContact(uid)
			}
		} else {
			// Open chat
			if (firstTime && $online.indexOf(uid) == -1) {
				alert("Contact offline, can't initiate a chat")
			} else {
				navigate("/")
				navigate(`/chat/${uid}`)
			}
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
			<button class="m-icon" title="Settings" on:click={() => navigate("/settings")}>settings</button>
			<button class="m-icon" title="Notifications">notifications</button>
		</span>
	</div>
	<div id="contact-list">
		{#each $contacts as contact}
			{@const uid = contact.uid}
			<div class="clickable {deleteMode ? "delete" : ""} {contact.firstTime ? "new" : ""}" on:click={() => clickHandler(uid, contact.firstTime)}>
				{ contact.name || uid }
				<span class="online-indicator {$online.indexOf(uid) > -1 ? "online" : ""}"></span>
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
		height: calc(100% - 30px);
		padding: env(titlebar-area-height, 20px) 10px 10px 10px;

		position: fixed;
		top:  0;
		left: 0;
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
	.new {
		outline: 3px solid orange !important;
	}
	.online-indicator {
		display: inline-block;
		width: 1ch;
		height: 1ch;
		background: var(--secondary);
		border-radius: 50%;
	}
	.online-indicator.online {
		background: springgreen;
		outline: 3px solid var(--bg);
	}
	.delete {
		color: crimson;
		outline: 3px solid crimson !important;
		animation: jigle .3s ease infinite;
	}
	.delete:hover {
		outline: 3px solid lightcoral !important;
	}
	@keyframes jigle {
		0% {
			transform: rotate(-.5deg);
		}
		50% {
			transform: rotate(.5deg);
		}
		100% {
			transform: rotate(-.5deg);
		}
	}
	@media (max-width: 900px) {
		#contacts {
			width: calc(100vw - 20px);
		}
	}
</style>