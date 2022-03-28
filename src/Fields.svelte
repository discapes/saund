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
		class="{field.class} 
		bg-gradient-to-r to-cyan-500 from-blue-500
		placeholder:text-slate-200
		border border-white 
		p-1.5 w-full h-10 my-1 text-xl
		select-none focus:outline"
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
</style>
