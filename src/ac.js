import autoComplete from "@tarekraafat/autocomplete.js";

let currAC;
let lastSelectedVal, nowOpen;
let i = 0;

export const genAC = (selectorElem) => {
    currAC?.close();
    lastSelectedVal = undefined;
    nowOpen = false;
    currAC = new autoComplete({
        data: {
            src: [
                { id: 1, name: "one" },
                { id: 2, name: "two" },
                { id: 3, name: "three" },
                { id: 4, name: "èèèat" },
            ],
            cache: true,
            keys: ["name"],
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: (event) => {
                    if (nowOpen) {
                        lastSelectedVal = event.detail.selection.value.name;
                        currAC.input.value = lastSelectedVal;
                    }
                },
                open: () => nowOpen = true,
                close: () => nowOpen = false,
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
        },
        threshold: 3,
        searchEngine: "loose",
        diacritics: true,
        submit: true,
    });
    i++;
    currAC.lastSelectedVal = () => lastSelectedVal;
    currAC.nowOpen = () => nowOpen;
    return currAC;
};