<script>
	import { tick, onMount } from "svelte";
	import { genAC } from "./ac.js";
	let acJS;

	let slots = Array.from({ length: 6 }, Object);
	let currentRow = 0;

	onMount(() => (acJS = genAC(slots[currentRow].elem)));

	function submit() {
		currentRow++;
		tick().then(() => slots[currentRow].elem.focus());
		acJS = genAC(slots[currentRow].elem);
	}

	function kd(e) {
		switch (e.key) {
			case "Enter":
				if (slots[currentRow].elem.value == acJS.lastSelectedVal()) {
					submit();
				}
				e.preventDefault();
				break;
			case "Tab":
				try {
					acJS.select();
				} catch {}
				e.preventDefault();
				break;
		}
	}
</script>

<div>
	<h1>Heardlo world!</h1>
	{#each slots as slot, i}
		<input
			bind:value={slot.val}
			bind:this={slot.elem}
			disabled={i != currentRow}
			on:keydown={kd}
			id="guessfield"
			placeholder={i == currentRow ? "Start typing..." : ""}
		/>
	{/each}
	<button on:click={submit}> Submit </button>
</div>

<style>
	:global(body) {
		background: #121213;
		color: white;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	input {
		box-sizing: border-box;
		display: block;
		margin: 50px;
		width: 400px;
		height: 40px;
		margin: 5px 1px;
		font-size: 1.5rem;
		color: white;
		user-select: none;
		border: 2px solid #3a3a3c;
		background: #121213;
		border-radius: 0;
	}
	input:focus {
		outline: 1px solid orange;
	}
	button {
		background: #121213;
		border: 1px solid orange;
		width: 400px;
		margin-top: 150px;
		height: 80px;
		font-size: 3rem;
		color: white;
		padding: 0px;
	}
	button:hover {
		background: rgba(255, 162, 0, 0.15);
	}
	button:active {
		background: #121213;
	}
</style>
