<script>
	import RightBox from "./rightBox.svelte"
	import { unread } from "$lib/js/backend.js"
  import { writable } from "svelte/store"
	import { DateTime } from "luxon"
	let unreads = writable({})
	unread.subscribe((value) => {
		$unreads = {}
		// Sort by uid
		value.forEach((message) => {
			// If dosn't exist
			if (!$unreads[message.uid]) {
				$unreads[message.uid] = {
					name: message.name,
					messages: []
				}
			}
			// Set the message
			$unreads[message.uid].messages.push(message)
			$unreads[message.uid].name = message.name
		})
	})
	// Mark person as read
	function markRead(uid) {
		unread.update((value) => {
			return value.filter((message) => {
				return message.uid != uid
			})
		})
	}
</script>

<RightBox title="Unread Messages">
	{#if $unread.length > 0}
		{#each Object.keys($unreads) as uid, i}
			<div class="person">
				<div class="person-header">
					<span style="font-size: x-large">{$unreads[uid].name}</span>
					<button class="m-icon" on:click={() => markRead(uid)}>mark_chat_read</button>
				</div>
				<div class="messages">
				{#each $unreads[uid].messages as message}
						<div class="message">
							{message.body}
							<span class="message-time">{DateTime.fromSeconds(message.timestamp).toFormat('dd/MM/yy t')}</span>
						</div>
				{/each}
				</div>
			</div>
		{/each}
	{:else}
		<div class="message">
			No Unread Notifications
		</div>
	{/if}
</RightBox>

<style>
	.person {
		background: var(--secondary);
		padding: 5px;
		border-radius: 10px;
		margin: 5px 0;
	}
	.person-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.messages {
		display: flex;
		flex-direction: column;
		gap: -3px;
		margin-top: 10px;
	}
	.message {
		padding: 5px;
		margin: 0;
		border-style: solid, none, none, none;
		border-top: 3px solid var(--bg);
		border-left: 3px solid var(--bg);
		border-right: 3px solid var(--bg);
	}
	.message:first-child {
		border-radius: 10px 10px 0 0;
	}
	.message:last-child {
		border-bottom: 3px solid var(--bg);
		border-radius: 0 0 10px 10px;
	}
	.message:only-child {
		border-radius: 10px;
	}
	.message-time {
		font-size: small;
		color: grey;
		text-align: right;
		display: block;
	}
	.message:not(:last-child) > .message-time {
		display: none;
	}
</style>