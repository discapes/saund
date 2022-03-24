import { tick } from 'svelte'
import { SOTD } from './music.js'
import { writable } from 'svelte/store';

export const fields = writable(makeFields());

function makeFields() {
    let fieldsObj = Array.from({ length: 6 }, Object);
    fieldsObj.i = 0;
    fieldsObj.current = fieldsObj[fieldsObj.i];

    fieldsObj.next = () => fieldsObj.current = fieldsObj[++fieldsObj.i];
    fieldsObj.disable = () => fieldsObj.current = null;
    fieldsObj.skip = () => {
        fieldsObj.current.class = "skipped";
        fieldsObj.current.val = "SKIPPED";
        fieldsObj.next();
        tick().then(() => fieldsObj.current.elem.focus());
        fields.update((o) => o);
    }

    fieldsObj.submit = () => {
        fieldsObj.current.val = fieldsObj.current.elem.value; // svelte why do I need to do this
        if (!fieldsObj.current.ac || fieldsObj.current.val === fieldsObj.current.ac.lastSelectedVal) {
            if (fieldsObj.current.val == SOTD.name) {
                fieldsObj.current.class = "correct";
                fieldsObj.disable();
            } else {
                fieldsObj.current.class = "incorrect";
                fieldsObj.next();
                tick().then(() => fieldsObj.current.elem.focus());
            }
            fields.update((o) => o);
        }
    }
    return fieldsObj;
}