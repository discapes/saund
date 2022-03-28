<script>
	import View from "./View.svelte";
</script>

<div
	class="
	 bg-gradient-to-r from-cyan-500 to-blue-500
	 flex
	 justify-center
	 items-center
	 h-full"
>
	<View />
</div>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	input,
	input:focus-visible,
	input:focus {
		outline-width: 2px;
		outline-color: white;
	}
	body {
		height: 100vh;
	}
	* {
		border-radius: 10px;
	}
	html {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		text-align: center;
		color: white;
	}
</style>

