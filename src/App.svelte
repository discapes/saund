<script>
	import Game from "./Game.svelte";
</script>

<div
	class="
	 bg-gradient-to-r from-primary-500 to-secondary-500
	 flex
	 justify-center
	 items-center
	 h-screen
	 rounded-none
	 overflow-auto"
>
	<Game />
</div>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	button {
		cursor: pointer;
		border-width: 1px;
	}
	html {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		text-align: center;
		color: white;
	}

	.autoComplete_wrapper {
		position: relative;
	}

	.autoComplete_wrapper > ul {
		z-index: 100;
		bottom: auto !important;
		top: 100% !important;
		position: absolute;
		left: 0;
		right: 0;
		margin: 0 -2px;
		padding: 0;
		text-align: left;
		list-style: none;
		@apply bg-gradient-to-r from-primary2-500/90 to-secondary2-500/90 border-2;
		transition: 0.15s ease-in-out;
		-moz-transition: 0.15s ease-in-out;
		-webkit-transition: 0.15s ease-in-out;
	}

	.autoComplete_wrapper > ul > li, .no_result {
		padding: 0.5rem 0.75rem;
		@apply border;
		letter-spacing: 1px;
		line-height: 1.3;
	}

	.autoComplete_wrapper > ul > li mark {
		background-color: transparent;
		color: white;
		font-weight: bold;
	}

	.autoComplete_wrapper > ul > li[aria-selected="true"] {
		cursor: pointer;
		@apply bg-gradient-to-l from-primary2-500/90 to-secondary2-500/90 !important;
	}

	.autoComplete_wrapper > ul > li:hover {
		@apply bg-gradient-to-r from-primary2-500/100 to-secondary2-500/100;
	}

	@keyframes fade-out {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	:focus-visible {
		outline: none;
	}
</style>
