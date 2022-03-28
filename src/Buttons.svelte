<script>
    import { fields } from "./fields";
</script>

{#if $fields.current}
<div class="flex my-8">
    <div class="grow mr-2">
        <button class="
        cursor-pointer border w-full h-full text-xl p-5 
        bg-neutral-500/50 hover:bg-neutral-500/70"
        on:click={$fields.skip}>Skip</button>
    </div>
    <div class="grow ml-2">
        <button class="
        cursor-pointer border w-full h-full text-xl p-5
        bg-submit-700/50 hover:bg-submit-700/70"
        on:click={$fields.submit}
        >Submit</button>
    </div>
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
