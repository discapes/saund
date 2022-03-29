<script>
    import { SOTD, info } from "./music.js";
    import { tick } from "svelte";
    let barWidth;

    let wid;
    let ready = false;
    const { cPos, playing, maxPos, resetOnPlay } = info;
    tick().then(() => {
        wid = SC.Widget("soundcloud");
        wid.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
            if (e.currentPosition >= $maxPos) {
                wid.pause();
                playing.set(false);
                resetOnPlay.set(true);
            } else {
                cPos.set(e.currentPosition);
            }
        });
        wid.bind(SC.Widget.Events.READY, () => (ready = true));
    });

    function play() {
        playing.set(!$playing);
        if ($playing) {
            if ($resetOnPlay) {
                wid.seekTo(0);
                cPos.set(0);
            }
            resetOnPlay.set(true);
            wid.play();
        } else {
            wid.pause();
        }
    }
</script>

<div bind:clientWidth={barWidth} class="border border-2 mt-3 h-5 relative">
    <div
        class="h-full absolute bg-white/30 overflow-hidden"
        style="width:{($maxPos / (16 * 1000)) * 100}%"
    >
        <div
            style="width: {($cPos / $maxPos) *
                100}%; background-size: {barWidth}px 100%;"
            class="h-full border-r box-content border-skipped-900 {$playing
                ? ' bg-gradient-to-r from-correct-500 via-incorrect-500 to-incorrect-500'
                : 'bg-gradient-to-r from-correct-500/70 via-incorrect-500/70 to-incorrect-500/70'}"
        />
    </div>
    <div class="w-px h-full absolute bg-white left-1/16" />
    <div class="w-px h-full absolute bg-white left-2/16" />
    <div class="w-px h-full absolute bg-white left-4/16" />
    <div class="w-px h-full absolute bg-white left-7/16" />
    <div class="w-px h-full absolute bg-white left-11/16" />
</div>

<button
    class="animation m-4 cursor-pointer border-transparent border-l-neutral-100 hover:border-l-white"
    disabled={!ready}
    class:playing={$playing}
    on:click={play}
/>

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

        &.playing {
            border-style: double;
            border-width: 0px 0 0px 60px;
        }
    }
</style>
