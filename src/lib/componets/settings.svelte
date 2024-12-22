<script>
	import RightBox from "./rightBox.svelte";
	import { myName } from "$lib/js/backend.js"
</script>

<RightBox title="Settings">
	<div id="settings">
		<section>
			<h2>User Settings</h2>
			<input type="text" placeholder="Name" id="name" bind:value={$myName}>
		</section>
		<hr>
		<section>
			<h2>Notification</h2>
			<h3>System Notification</h3>
			{#if Notification.permission === "granted"}
				<label>
					<span>Enabled</span>
					<input type="checkbox" checked>
				</label>
				<label>
					<span>Important Only</span>
					<input type="checkbox">
				</label>
				<label>
					<span>Silent</span>
					<input type="checkbox">
				</label>
			{:else}
				<span>Disabled, unable to send Notifications.</span>
				<button on:click={() => Notification.requestPermission()}>Enable</button>
			{/if}
			<h3>Toast Notification</h3>
			<label>
				<span>Enabled</span>
				<input type="checkbox" checked>
			</label>
			<label>
				<span>Important Only</span>
				<input type="checkbox">
			</label>
		</section>
		<hr>
		<section>
			<h2>Data Stored</h2>
			Nothing avalible yet.
		</section>
	</div>
</RightBox>

<style>
	#settings {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		height: 100%;
	}
	h2 {
		margin: 0;
	}
	h3 {
		margin: 20px 0 0 0;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0 0 40px 0;
	}
</style>