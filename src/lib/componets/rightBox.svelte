<script>
	import { navigate } from "svelte-routing";
	export let title=""
</script>

<div id="right-box">
	<div id="top-control">
		<button class="m-icon" on:click={() => navigate("/")}>arrow_back</button>
		<span class="f-b">{title}</span>
		<div id="right-control">

		</div>
	</div>
	<div id="right-box-content">
		<slot></slot>
	</div>
</div>

<style>
	#right-box {
		position: fixed;
		top: 15px;
		left: calc(30vw + 25px);
		
		width: calc(70vw - 40px);
		height: calc(100% - 30px);
		border-radius: 10px;
		background: var(--bg);
		outline: 5px solid var(--secondary);
	}
	@media (max-width: 900px) {
		#right-box {
			left: 15px;
			width: calc(100vw - 30px);
		}
	}
	#top-control {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;

		user-select: none;
		background: var(--secondary);
		padding: 5px;
	}
	#right-box-content {
		padding: 10px;
		height: calc(100% - 85px);
	}
</style>