<script>
    import Fields from "./Fields.svelte";
    import Player from "./Player.svelte";
    import Buttons from "./Buttons.svelte";
    import Credits from "./Credits.svelte";
    import Music from "./Music.svelte";
    import { songs } from "./songs.js";
    import { tick } from "svelte";
    import { AC } from "./ac";

    const lengths = [1, 2, 4, 7, 11, 16];
    const song = songs[Math.floor(Math.random() * songs.length)];
    song.artwork;

    let game = {
        over: false,
        guesses: 0,
        fields: Array(6),
        keepPos: false,
        statuses: Array(6).fill(""),
    };
    let ac;
    let music;

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
        music.setDur(30*1000);
        game.over = true;
        music.seek(0);
        music.play();
    }

    tick().then(() => {
        ac = AC(game.fields[0]);
        game.fields[0].focus();
    });

    let buttonHeight = 0;
    let status;
</script>

<div class="w-full max-w-xl scale-[85%] my-[-10vh]">
    <h1 class="text-5xl font-bold m-4">Hello hearld</h1>
    <Music {song} bind:artwork={song.artwork} bind:this={music} bind:status/>
    <Fields {ac} {submit} {game} />
    {#if music}
        <Player
            status={status}
            toggle={() => {
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
            <Credits {song} height={buttonHeight} />
        {/if}
    </div>
</div>
