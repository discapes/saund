<script>
	import { tick, onMount } from "svelte";
	import autoComplete from "@tarekraafat/autocomplete.js";
	let autoCompleteJS;
	const acConfig = {
		data: {
			src: [
				{ id: 1, name: "one" },
				{ id: 2, name: "two" },
				{ id: 3, name: "three" },
			],
			cache: true,
			keys: ["name"],
		},
		resultItem: {
			highlight: true,
		},
		events: {
			input: {
				selection: (event) => {
					const selection = event.detail.selection.value.name;
					autoCompleteJS.input.value = selection;
				},
			},
		},
		selector: () => slots[currentRow].elem,
	};
	onMount(() => {
		autoCompleteJS = new autoComplete(acConfig);
	});

	let slots = Array.from({ length: 6 }, Object);
	let currentRow = 0;

	function kd(e) {
		// if (e.key === "Enter") {
		// 	currentRow++;
		// 	tick().then(() => slots[currentRow].elem.focus());
		// 	autoCompleteJS.close();
		// 	autoCompleteJS = new autoComplete(acConfig);
		// }
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
	<button> Submit </button>
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
