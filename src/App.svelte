<script>
	import View from "./View.svelte";
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
	<View />
</div>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	html {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		text-align: center;
		color: white;
	}
</style>
