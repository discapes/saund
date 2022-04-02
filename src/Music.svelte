<script>
    import { onMount } from "svelte";
    
    export let song;

    export let status = {
        pos: 0,
        dur: 1000,
        ready: false,
        paused: true,
    };
    export let info;

    let resetOnToggle = false;
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
        if (!status.ready) return;
        if (status.paused && resetOnToggle) seek(0);
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
            wid.getCurrentSound((cs) => (info = cs));
        });
    });
</script>

<iframe
    allow="autoplay"
    id="soundcloud"
    src="https://w.soundcloud.com/player/?url={song.url}"
    style="display:none"
/>
