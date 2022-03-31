import { writable } from 'svelte/store';
import { songs } from './songs.js';

function getSOTD() {
    return songs[Math.floor(Math.random()*songs.length)]
}
export const SOTD = getSOTD();

function getStoreVal(store) {
    let val;
    store.subscribe(value => val = value)();
    return val;
}

export const info = {
    maxPos: writable(1*1000),
    cPos: writable(0),
    playing: writable(false),
    resetOnPlay: writable(true),
    wid: undefined,
    play: undefined,
    nextMax() {
        switch (getStoreVal(this.maxPos)) {
            case 1000: 
                return 2000;
            case 2000:
                return 4000;
            case 4000:
                return 7000;
            case 7000:
                return 11000;
            case 11000:
                return 16000;
            default:
                return 16000;
        }
    }
}