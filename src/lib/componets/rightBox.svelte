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
		top: env(titlebar-area-height, 20px);
		left: calc(30vw + 30px);
		
		width: calc(70vw - 55px);
		height: calc(100% - 40px);
		border-radius: 10px;
		background: var(--bg);
		border: 5px solid var(--secondary);
	}
	@media (max-width: 900px) {
		#right-box {
			left: 10px;
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