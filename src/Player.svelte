<script>
import Game from "./Game.svelte";


    export let status;
    export let gameOver;
    export let toggle;

    let secDur = 0;
    let secPos = 0;
    $: secDur = status.dur / 1000;
    $: secPos = status.pos / 1000;

    const formatNum1 = (n) => (n > 9 ? Math.floor(n) : "0" + Math.floor(n));
    const formatNum2 = (n) => {
        let min = Math.floor(Math.floor(n) / 60);
        let s = Math.floor(Math.floor(n)) % 60;
        return `${min}:${formatNum1(s)}`;
    };

    let barWidth;
</script>

<div class:opacity-50={!status.ready}>
<div
    bind:clientWidth={barWidth}
    class="border border-2 h-5 relative overflow-hidden"
>
    <div
        class="h-full absolute bg-white/30 overflow-hidden"
        style="width:{(secDur / Math.max(16, secDur)) * 100}%"
    >
        <div
            style="width: {(secPos / secDur) *
                100}%; background-size: {barWidth}px 100%;"
            class="h-full border-r box-content border-skipped-900 bg-gradient-to-r f
                {!status.paused
                ? 'from-correct-500 via-incorrect-500 to-incorrect-500'
                : 'from-correct-500/50 via-incorrect-500/50 to-incorrect-500/50'}"
        />
    </div>
    {#if !gameOver}
        <div class="w-px h-full absolute bg-white left-1/16" />
        <div class="w-px h-full absolute bg-white left-2/16" />
        <div class="w-px h-full absolute bg-white left-4/16" />
        <div class="w-px h-full absolute bg-white left-7/16" />
        <div class="w-px h-full absolute bg-white left-11/16" />
    {/if}
</div>

<div class="mt-4 text-xl relative h-[74px]">
    <div class="left-0 top-0 absolute">
        {formatNum2(secPos)}
    </div>
    <button
        class="animation"
        disabled={!status.ready}
        class:playing={!status.paused}
        on:click|preventDefault={toggle}
    />
    <div class="right-0 top-0 absolute">
        {formatNum2(secDur)}
    </div>
</div>
</div>

<style lang="scss">
    .animation {
        transition: 100ms all ease;
        height: 100%;
        box-sizing: border-box;

        border-radius: 0px;
        border-style: solid;
        border-width: 37px 0 37px 60px;
        border-color: transparent transparent transparent #f5f5f5;

        &.playing {
            border-style: double;
            border-width: 0px 0 0px 60px;
        }
        &:hover {
            border-color: transparent transparent transparent #ffffff;
        }
    }
</style>
