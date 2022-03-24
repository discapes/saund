<script>
	import { tick, onMount } from "svelte";
	import { genAC } from "./ac.js";
	import { getSOTD } from "./music.js";

	const SOTD = getSOTD();

	let slots = Array.from({ length: 6 }, Object);
	let cRow = 0; // c = current

	onMount(() => {
		for (let s of slots) {
			s.ac = genAC(s.elem);
			s.bg = "var(--bg-color)";
		}
	});

	function submit() {
		if (slots[cRow].elem.value == slots[cRow].ac.lastSelectedVal) {
			if (slots[cRow].elem.value == SOTD.name) {
				slots[cRow].bg = "rgba(var(--theme-rgb), 0.50)";
				slots[cRow].elem.style = slots[cRow].elem.style += ";outline: 1px solid var(--theme);";
				cRow = -1;
			} else {
				slots[cRow].bg = "var(--grey)";

				cRow++;
				tick().then(() => slots[cRow].elem.focus());
			}
		}
	}

	function kd(e) {
		switch (e.key) {
			case "Enter":
				submit();
				e.preventDefault();
				break;
			case "Tab":
				try {
					slots[cRow].ac.select();
				} catch {}
				e.preventDefault();
				break;
		}
	}
</script>

<div>
	<h1>Hello world!</h1>
	{#each slots as slot, i}
		<input
			bind:this={slot.elem}
			disabled={i != cRow}
			on:keydown={kd}
			id="guessfield"
			placeholder={i == cRow ? "Start typing..." : ""}
			style="background:{slot.bg}"
		/>
	{/each}
	<button on:click={submit} style={cRow != -1 ? "" : "display:none"}> Submit </button>
</div>

<style>
	:global(body) {
		background: var(--bg-color);
		color: white;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	:root {
		--bg-color: #121213;
		--correct: #538d4e;
		--grey: #3a3a3c;
		--theme: cyan;
		--theme-rgb: 0, 255, 255;
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
		border: 2px solid var(--grey);
		border-radius: 0;
	}
	input:focus {
		outline: 1px solid var(--theme);
	}
	button {
		background: var(--bg-color);
		border: 1px solid var(--theme);
		width: 400px;
		margin-top: 100px;
		height: 80px;
		font-size: 3rem;
		color: white;
		padding: 0px;
	}
	button:hover {
		background-color: rgba(var(--theme-rgb), 0.15);
	}
	button:active {
		background: var(--bg-color);
	}
</style>
