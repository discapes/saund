<script>
    import Fields from './Fields.svelte'
    import Player from './Player.svelte'
    import Buttons from './Buttons.svelte'
</script>

<div class="container">
	<h1>Hello world!</h1>
    <Fields></Fields>
    <Player></Player>
    <Buttons></Buttons>
</div>

<style>
	.container {
		width: 100%;
		max-width: 400px;
	}
	:root {
		--bg-color: #121213;
		--correct: #538d4e;
		--grey: #3a3a3c;
		--theme: cyan;
		--theme-rgb: 0, 255, 255;
	}
    :global(body) {
		background: var(--bg-color);
		color: white;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>