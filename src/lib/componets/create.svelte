<script>
	import RightBox from "./rightBox.svelte";
	import { createAccount } from "$lib/js/backend.js";
  import { navigate } from "svelte-routing";
	// Create Account
	function createSelf() {
		createAccount(document.getElementById("new-name").value,
		document.getElementById("email").value)
		navigate("/")
		window.location.reload()
	}
</script>

<RightBox title="Create Account">
	<div id="create-content">
		<img src="/zinc.svg" id="logo" alt="Zinc Logo">
		<h3>Create a new Zinc P2P Account</h3>
		<input type="text" placeholder="Name" id="new-name">
		<input type="email" placeholder="Email" id="email" inputmode="email">
		<button class="m-icon" on:click={createSelf}>login</button>
	</div>
</RightBox>

<style>
	#create-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}
	#logo {
		width: 20%;
		border-radius: 20%;
	}
</style>