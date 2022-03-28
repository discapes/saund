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

    let unpaused = false;
    function play() {
        unpaused = !unpaused;
        wid.toggle();
    }
</script>

<button class="playbtn" class:unpaused on:click={play} />

<iframe
    id="soundcloud"
    allow="autoplay"
    src="https://w.soundcloud.com/player/?url={SOTD.url}"
    style="display:none"
/>

<style lang="scss">
    .playbtn {
        border: 0;
        background: transparent;
        box-sizing: border-box;
        width: 0;
        height: 74px;

        border-color: transparent transparent transparent whitesmoke;
        transition: 100ms all ease;
        cursor: pointer;

        // play state
        border-style: solid;
        border-width: 37px 0 37px 60px;

        &.unpaused {
            border-style: double;
            border-width: 0px 0 0px 60px;
        }

        &:hover {
            border-color: transparent transparent transparent white;
        }
    }
</style>
