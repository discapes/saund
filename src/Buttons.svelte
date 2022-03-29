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
        cursor-pointer border w-full h-full text-xl p-5 
        bg-neutral-500/50 hover:bg-neutral-500/70"
            on:click={$fields.skip}
            >Skip{moreSecs ? ` (+${moreSecs}s)` : ""}</button
        >

        <button
            class="ml-2
        cursor-pointer border w-full h-full text-xl p-5
        bg-submit-700/50 hover:bg-submit-700/70"
            on:click={$fields.submit}>Submit</button
        >
    </div>
{/if}

<style>
    /* TODO
    @media (hover: none) {
        button:active {
            background-color: rgba(var(--theme-rgb), 0.15);
        }
    } */
</style>
