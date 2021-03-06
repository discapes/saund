import autoComplete from "@tarekraafat/autocomplete.js";
import { options } from './songs.js';

export function AC(field) {
    let ac = new autoComplete({
        data: {
            src: options,
            cache: true,
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: (event) => {
                    ac.lastSelectedVal = event.detail.selection.value;
                    ac.input.value = ac.lastSelectedVal;
                },
            },
        },
        selector: () => field,
        resultsList: {
            element: (list, data) => {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", "no_result");
                    message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                    list.prepend(message);
                }
            },
            noResults: true,
        },
        threshold: 3,
        searchEngine: "loose",
        diacritics: true,
        submit: true,
    });
    return ac;
}