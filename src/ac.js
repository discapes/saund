import autoComplete from "@tarekraafat/autocomplete.js";

export const genAC = (selectorElem) => {
    let ac = new autoComplete({
        data: {
            src: [
                { id: 1, name: "one" },
                { id: 2, name: "two" },
                { id: 3, name: "three" },
                { id: 4, name: "èèèat" },
                { id: 5, name: "thrèèè" },
                { id: 6, name: "song1" },
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
                    ac.lastSelectedVal = event.detail.selection.value.name;
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
        },
        threshold: 3,
        searchEngine: "loose",
        diacritics: true,
        submit: true,
    });
    return ac;
};