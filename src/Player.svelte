<script>
    import { SOTD } from "./music.js";
    import { tick } from "svelte";

    let wid;
    let currentPosition = 0; // ms
    tick().then(() => {
        wid = SC.Widget("soundcloud");
        wid.bind(
            SC.Widget.Events.PLAY_PROGRESS,
            (e) => (currentPosition = e.currentPosition)
        );
    });

    let playing = false;
    function play() {
        playing = !playing;
        if (playing) {
            wid.seekTo(0);
            currentPosition = 0;
        }
        wid.toggle();
    }
</script>

<div style="width:{currentPosition/100}%;" class="h-5 mt-5 {playing?"bg-white":"bg-neutral-100"}" />

<button
    class="animation m-4 cursor-pointer border-transparent border-l-neutral-100 hover:border-l-white"
    class:playing
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
