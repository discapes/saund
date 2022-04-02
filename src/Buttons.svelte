<script>
    export let submit;
    export let skip;
    export let addSeconds;
    export let height;
</script>

<div class="flex">
    <button
        class="mr-2
    w-full h-full text-xl p-5 
    bg-neutral-500/50 
    touch:active:bg-neutral-500/70 
    mouse:hover:bg-neutral-500/70"
        on:click={skip}>Skip{addSeconds ? ` (+${addSeconds}s)` : ""}</button
    >

    <button
        class="ml-2
    w-full h-full text-xl p-5
    bg-submit-700/50 
    touch:active:bg-submit-700/70 
    mouse:hover:bg-submit-700/70"
        on:click={submit}
        bind:clientHeight={height}>Submit</button
    >
</div>
