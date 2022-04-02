<script>
	export let game;
	export let submit;

	function kd(e) {
		if (e.key === "Enter") {
			submit();
			e.preventDefault();
		}
	}

	let bgHeight;
</script>

<div bind:clientHeight={bgHeight}>
	{#each game.fields as _, i}
		<div
			class="bg-gradient-to-t from-primary2-500/20 to-secondary2-500/70
		 w-full h-10 my-2"
			style="background-size: 100% {bgHeight}px;
				background-position: 0 -{i * 100}%"
		>
			<input
				bind:this={game.fields[i]}
				disabled={i != game.guesses}
				on:keydown={kd}
				class="{game.statuses[i]}
				bg-transparent
		border focus:outline outline-2 outline-white
		placeholder:text-neutral-200 select-none
		p-1.5 text-xl w-full "
				placeholder={i == game.guesses ? "Search for song..." : ""}
			/>
		</div>
	{/each}
</div>

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
