<script>
    import Fields from "./Fields.svelte";
    import Player from "./Player.svelte";
    import Buttons from "./Buttons.svelte";
    import Credits from "./Credits.svelte";
    import Music from "./Music.svelte";
    import { songs } from "./songs.js";
    import { tick } from "svelte";
    import { AC } from "./ac";

    function preloadImage(url) {
        var img = new Image();
        img.src = url;
        return url;
    }
    function message(text, duration) {
        let div = document.createElement("div");
        div.innerText = text;
        div.className = "left-1/2 top-1/2 fixed bg-black/80 p-5 rounded-xl";
        div.style.transform = "translate(-50%, -50%)";
        div.style.animation = `fade-out ${duration}s`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), duration * 1000);
    }
    async function autoplayAllowed() {
        let data = new Blob(
            [
                new Uint8Array([
                    255, 227, 24, 196, 0, 0, 0, 3, 72, 1, 64, 0, 0, 4, 132, 16,
                    31, 227, 192, 225, 76, 255, 67, 12, 255, 221, 27, 255, 228,
                    97, 73, 63, 255, 195, 131, 69, 192, 232, 223, 255, 255, 207,
                    102, 239, 255, 255, 255, 101, 158, 206, 70, 20, 59, 255,
                    254, 95, 70, 149, 66, 4, 16, 128, 0, 2, 2, 32, 240, 138,
                    255, 36, 106, 183, 255, 227, 24, 196, 59, 11, 34, 62, 80,
                    49, 135, 40, 0, 253, 29, 191, 209, 200, 141, 71, 7, 255,
                    252, 152, 74, 15, 130, 33, 185, 6, 63, 255, 252, 195, 70,
                    203, 86, 53, 15, 255, 255, 247, 103, 76, 121, 64, 32, 47,
                    255, 34, 227, 194, 209, 138, 76, 65, 77, 69, 51, 46, 57, 55,
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 255, 227,
                    24, 196, 73, 13, 153, 210, 100, 81, 135, 56, 0, 170, 170,
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170, 170, 170, 170, 170, 170,
                ]),
            ],
            { type: "audio/mpeg" }
        );
        let sound = document.createElement("audio");
        sound.src = URL.createObjectURL(data);
        try {
            await sound.play();
            return true;
        } catch {
            return false;
        }
    }

    const lengths = [1, 2, 4, 7, 11, 16];
    const song = songs[Math.floor(Math.random() * songs.length)];

    let game = {
        over: false,
        guesses: 0,
        fields: Array(6),
        keepPos: false,
        statuses: Array(6).fill(""),
    };
    let ac;
    let music;
    let songInfo;
    $: if (songInfo?.artwork_url) preloadImage(songInfo.artwork_url);
    let retryButton;

    function guessMade() {
        game.guesses++;
        if (game.guesses == 6) {
            end();
        } else {
            ac = AC(game.fields[game.guesses]);
            tick().then(() => game.fields[game.guesses].focus());
            music.setDur(lengths[game.guesses] * 1000);
        }
        music.setResetOnToggle(false);
    }
    function submit() {
        if (game.fields[game.guesses].value === "") skip();
        else if (game.fields[game.guesses].value == ac.lastSelectedVal) {
            if (game.fields[game.guesses].value == song.name) {
                game.statuses[game.guesses] = "correct";
                end();
            } else {
                game.statuses[game.guesses] = "incorrect";
                guessMade();
            }
        }
    }
    function skip() {
        game.statuses[game.guesses] = "skipped";
        game.fields[game.guesses].value = "SKIPPED";
        guessMade();
    }
    function end() {
        music.setDur(songInfo.duration);
        game.over = true;
        music.seek(0);
        music.play();
        tick().then(() => retryButton.focus());
    }
    function toggle() {
        tip = "";
        music.toggle();
        music.setResetOnToggle(true);
    }

    tick().then(() => {
        ac = AC(game.fields[0]);
        game.fields[0].focus();
    });

    let tip = "Click the play button or press Tab";
    const clickAnywhereTip = "Click anywhere to enable using Tab";
    let testAutoplay = navigator.userAgent.toLowerCase().includes("firefox");
    async function kd(e) {
        if (e.key == "Tab") {
            if (testAutoplay && !(await autoplayAllowed())) {
                tip = clickAnywhereTip;
            } else {
                testAutoplay = false;
                toggle();
            }
            e.preventDefault();
        }
    }
    function clk() {
        if (tip == clickAnywhereTip) {
            testAutoplay = false;
            tip = "";
        }
    }

    let buttonHeight = 0;
    let status;
</script>

<svelte:window on:keydown={kd} on:click={clk} />
<div class="w-full max-w-xl scale-[85%] my-[-10vh]">
    <h1 class="text-5xl font-bold m-4">Hello hearld</h1>
    <Music {song} bind:info={songInfo} bind:this={music} bind:status />
    <Fields {submit} {game} />

    <div class="h-20 flex items-center justify-center">
        {tip}
    </div>
    {#if music}
        <Player {status} {toggle} />
    {/if}
    <div class="my-4">
        {#if !game.over}
            <Buttons
                addSeconds={lengths[game.guesses + 1] - lengths[game.guesses]}
                {skip}
                {submit}
                bind:height={buttonHeight}
            />
        {:else}
            <Credits
                {song}
                artwork={songInfo.artwork_url}
                height={buttonHeight}
                bind:retryButton
            />
        {/if}
    </div>
</div>
