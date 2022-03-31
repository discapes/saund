import { tick } from 'svelte'
import { SOTD, info } from './music.js'
import { writable } from 'svelte/store';

export const fields = writable(makeFields());

function makeFields() {
    let self = Array.from({ length: 6 }, Object);
    self.i = 0;
    self.current = self[self.i];

    self.end = () => {
        self.current = null;
        info.resetOnPlay.set(false);
        info.maxPos.set(10*60*1000);
        info.play(true);
    };
    self.next = () => {
        self.i++;
        if (self.i == 6) {
            self.end();
        } else {
            info.resetOnPlay.set(false);
            self.current = self[self.i];
            tick().then(() => self.current.elem.focus());
            info.maxPos.set(info.nextMax());
        }
    };
    self.skip = () => {
        self.current.class = "skipped";
        self.current.val = "SKIPPED";
        self.next();
        fields.update((o) => o);
    }

    self.submit = () => {
        self.current.val = self.current.elem.value; // svelte why do I need to do this
        if (!self.current.ac || self.current.val === self.current.ac.lastSelectedVal) {
            if (self.current.val == SOTD.name) {
                self.current.class = "correct";
                self.end();
            } else {
                self.current.class = "incorrect";
                self.next();
            }
            fields.update((o) => o);
        } else if (self.current.val === "") {
            self.skip();
        }
    }
    return self;
}