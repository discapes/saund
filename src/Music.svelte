<script>
    import { onMount } from "svelte";
    function preloadImage(url) {
        var img = new Image();
        img.src = url;
        return url;
    }

    export let song;

    export let status = {
        pos: 0,
        dur: 1000,
        ready: false,
        paused: true,
    };
    export let artwork;

    let resetOnToggle = false;
    let songLength;
    let wid;

    export function play() {
        status.paused = false;
        wid.play();
    }
    export function pause() {
        status.paused = true;
        wid.pause();
    }
    export function toggle() {
        if (resetOnToggle) seek(0);
        status.paused = !status.paused;
        wid.toggle();
    }
    export function seek(pos) {
        status.pos = pos;
        wid.seekTo(pos);
    }
    export function setResetOnToggle(r) {
        resetOnToggle = r;
    }
    export function setDur(dur) {
        status.dur = dur;
    }
    export function getSongLength() {
        return songLength;
    }

    onMount(() => {
        wid = SC.Widget("soundcloud");
        wid.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
            status.pos = e.currentPosition;
            if (e.currentPosition >= status.dur) {
                resetOnToggle = true;
                pause();
            }
        });

        wid.bind(SC.Widget.Events.READY, () => {
            status.ready = true;
            wid.getDuration((l) => (songLength = l));
            wid.getCurrentSound(
                (cs) => (artwork = preloadImage(cs.artwork_url))
            );
        });
    });
</script>

<iframe
    id="soundcloud"
    src="https://w.soundcloud.com/player/?url={song.url}"
    style="display:none"
/>
