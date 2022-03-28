<script>
    import { fields } from "./fields";
</script>

<div class="buttons m-4">
    <button on:click={$fields.skip} style={$fields.current ? "" : "display:none"}>
        Skip
    </button>
    <button on:click={$fields.submit} style={$fields.current ? "" : "display:none"}>
        Submit
    </button>
</div>

<style>
    .buttons button {
        background: var(--bg-color);
        border: 1px solid var(--theme);
        font-size: 2rem;
        color: white;
        cursor: pointer;
        padding: 0px 10px;
        float: left;
        flex-grow: 1;
    }
    .buttons button:first-of-type {
        margin-right: 10px;
    }
    .buttons {
        display: flex;
        justify-content: space-around;
        padding: 0px;
    }
    @media (hover: hover) {
        button:hover {
            background-color: rgba(var(--theme-rgb), 0.15);
        }
        button:active {
            background: var(--bg-color);
        }
    }
    @media (hover: none) {
        button:active {
            background-color: rgba(var(--theme-rgb), 0.15);
        }
    }
</style>
