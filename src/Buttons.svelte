<script>
    import { fields } from "./fields";
    import { info } from "./music.js";
    let moreSecs = 1;
    let { maxPos } = info;
    $: moreSecs = (info.nextMax() - $maxPos) / 1000;
</script>

{#if $fields.current}
    <div class="flex my-4">
        <button
            class="mr-2
        w-full h-full text-xl p-5 
        bg-neutral-500/50 
        touch:active:bg-neutral-500/70 
        mouse:hover:bg-neutral-500/70"
            on:click={$fields.skip}
            >Skip{moreSecs ? ` (+${moreSecs}s)` : ""}</button
        >

        <button
            class="ml-2
        w-full h-full text-xl p-5
        bg-submit-700/50 
        touch:active:bg-submit-700/70 
        mouse:hover:bg-submit-700/70"
            on:click={$fields.submit}>Submit</button
        >
    </div>
{/if}
