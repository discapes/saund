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

    tick().then(() => {
        ac = AC(game.fields[0]);
        game.fields[0].focus();
    });

    function kd(e) {
        if (e.key == "Tab") {
            if (
                !autoplayAsked &&
                navigator.userAgent.toLowerCase().includes("firefox")
            ) {
                alert("Enable autoplay");
                autoplayAsked = true;
            } else {
                showTip = false;
                music.toggle();
                music.setResetOnToggle(true);
            }
            e.preventDefault();
        }
    }

    let buttonHeight = 0;
    let status;
    let showTip = true;
    let autoplayAsked = false;
    var sound      = document.createElement('audio');
sound.src      = 'https://www.kozco.com/tech/LRMonoPhase4.mp3';
//sound.src = URL.createObjectURL(AUDIO);
sound.play();
</script>

<svelte:window on:keydown={kd} />
<div class="w-full max-w-xl scale-[85%] my-[-10vh]">
    <h1 class="text-5xl font-bold m-4">Hello hearld</h1>
    <Music {song} bind:info={songInfo} bind:this={music} bind:status />
    <Fields {submit} {game} />

    <div class="h-20 flex items-center justify-center">
        {#if showTip}
            Click the play button or press Tab
        {/if}
    </div>
    {#if music}
        <Player
            {status}
            toggle={() => {
                showTip = false;
                music.toggle();
                music.setResetOnToggle(true);
            }}
        />
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
