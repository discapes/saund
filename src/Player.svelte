<script>
    import { SOTD, info } from "./music.js";
    import { tick } from "svelte";
    let barWidth;

    const formatNum1 = (n) => (n > 9 ? n : "0" + n);
    const formatNum2 = (n) => {
        let min = Math.floor(n / 60);
        let s = Math.floor(n) % 60;
        return `${min}:${formatNum1(s)}`;
    };

    let ready = false;
    const { cPos, playing, maxPos, resetOnPlay } = info;
    tick().then(() => {
        info.wid = SC.Widget("soundcloud");
        info.wid.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
            cPos.set(e.currentPosition);
            if (e.currentPosition >= $maxPos) {
                info.wid.pause();
                playing.set(false);
                resetOnPlay.set(true);
            }
        });
        info.wid.bind(SC.Widget.Events.READY, () => (ready = true));
    });

    let duration;
    $: if (ready) info.wid.getDuration((dur) => (duration = dur));

    const play = (_playing = !$playing) => {
        playing.set(_playing);
        if ($playing) {
            if ($resetOnPlay) {
                info.wid.seekTo(0);
                cPos.set(0);
            }
            info.wid.play();
        } else {
            info.wid.pause();
        }
        resetOnPlay.set(true);
    }
    info.play = play;
</script>

<div
    bind:clientWidth={barWidth}
    class="border border-2 mt-3 h-5 relative overflow-hidden"
>
    <div
        class="h-full absolute bg-white/30 overflow-hidden"
        style="width:{($maxPos / (16 * 1000)) * 100}%"
    >
        <div
            style="width: {($cPos / $maxPos) *
                100}%; background-size: {barWidth}px 100%;"
            class="h-full border-r box-content border-skipped-900 
                {$playing
                ? 'bg-gradient-to-r from-correct-500 via-incorrect-500 to-incorrect-500'
                : 'bg-gradient-to-r from-correct-500/50 via-incorrect-500/50 to-incorrect-500/50'}"
        />
    </div>
    <div class="w-px h-full absolute bg-white left-1/16" />
    <div class="w-px h-full absolute bg-white left-2/16" />
    <div class="w-px h-full absolute bg-white left-4/16" />
    <div class="w-px h-full absolute bg-white left-7/16" />
    <div class="w-px h-full absolute bg-white left-11/16" />
</div>

<div class="mt-4 text-xl relative">
    <div class="left-0 top-0 absolute">
        0:{formatNum1(Math.floor($cPos / 1000))}
    </div>

    <button
        class="animation"
        disabled={!ready}
        class:playing={$playing}
        on:click={() => play()}
    />
    <div class="right-0 top-0 absolute">
        {#if $maxPos <= 16000}
            0:{formatNum1($maxPos / 1000)}
        {:else}
            {formatNum2(duration / 1000)}
        {/if}
    </div>
</div>

<iframe
    id="soundcloud"
    allow="autoplay"
    src="https://w.soundcloud.com/player/?url={SOTD.url}"
    style="display:none"
/>

<style lang="scss">
    .animation {
        transition: 100ms all ease;
        height: 74px;

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
