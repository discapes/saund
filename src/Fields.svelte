<script>
	import { onMount } from "svelte";
	import { genAC } from "./ac.js";
	import { fields } from "./fields.js"

	onMount(() => {
		for (let f of $fields) {
			f.ac = genAC(f.elem);
		}
		$fields.current.elem.focus();
	});

	function kd(e) {
		if (e.key === "Enter") {
			$fields.submit();
		} else if (e.key === "Tab") {
			try {
			$fields.current.ac.select();
			} catch {}
		} else {
			return;
		}
		e.preventDefault();
	}
</script>

{#each $fields as field}
	<input
		bind:this={field.elem}
		bind:value={field.val}
		disabled={field !== $fields.current}
		on:keydown={kd}
		class={field.class}
		id="guessfield"
		placeholder={field === $fields.current ? "Start typing..." : ""}
	/>
{/each}

<style>
	.correct {
		background: rgba(var(--theme-rgb), 0.50);	
		outline: 1px solid var(--theme);
	}
	.incorrect {
		background: var(--grey);
	}
	.skipped {
		background: var(--grey);
		color:grey;
		font-weight: bold;
	}
	input {
		box-sizing: border-box;
		display: block;
		margin: 50px;
		width: 100%;
		height: 40px;
		margin: 5px 1px;
		font-size: 1.5rem;
		color: white;
		user-select: none;
		border: 2px solid var(--grey);
		background: var(--bg-color);
		border-radius: 0;
	}
	input:focus {
		outline: 1px solid var(--theme);
	}
</style>
