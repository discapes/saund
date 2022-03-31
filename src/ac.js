import autoComplete from "@tarekraafat/autocomplete.js";
import { options } from './songs.js';

export const genAC = (selectorElem) => {
    let ac = new autoComplete({
        data: {
            src: options,
            cache: true,
        },
        resultItem: {
            highlight: true,
            class: ""
        },
        events: {
            input: {
                selection: (event) => {
                    ac.lastSelectedVal = event.detail.selection.value;
                    ac.input.value = ac.lastSelectedVal;
                },  
            },
        },
        selector: () => selectorElem,
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
            class: "border bg-black relative mx-[-1px]"
        },
        threshold: 3,
        searchEngine: "loose",
        diacritics: true,
        submit: true,
    });
    return ac;
};