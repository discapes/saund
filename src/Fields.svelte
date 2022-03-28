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
		class="{field.class ? field.class : "bg-gradient-to-r to-primary-500 from-secondary-500"} 
		border border-white focus:outline outline-2 outline-white
		placeholder:text-neutral-200 select-none
		p-1.5 w-full h-10 my-1 text-xl"
		id="guessfield"
		placeholder={field === $fields.current ? "Start typing..." : ""}
	/>
{/each}

<style lang="postcss">
	.correct {
		@apply outline bg-correct-700/50;
	}
	.incorrect {
		@apply bg-incorrect-500/50;
	}
	.skipped {
		@apply font-bold bg-skipped-500/50;
		color: #f0f0f0f0;
	}
</style>
