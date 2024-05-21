import { setRandomSeed } from './random.js';
import { readDataJson } from './goals.js';
import rankCardGenerator from './generators/rankCardGenerator.js';

var data;
const queryParams = new URLSearchParams(window.location.search);

document.addEventListener('DOMContentLoaded', function () {
    readDataJson().then(d => {
        data = d;
        let generator = null;
        for (let [key, value] of queryParams) {
            key = key.toLowerCase();
            let element = document.getElementById(key);
            if (!element) {
                continue;
            }
            if (element.dataset.generator != undefined) {
                generator = element.dataset.generator;
            }
            if (element.type == "checkbox") {
                element.checked = true;
                continue;
            }
            if (element.id != "room") {
                value = value.toUpperCase();
            }
            element.value = value;
        }

        let seed = document.getElementById("seed");
        if (seed.value.length == 0) {
            rollSeed();
        }

        if (generator != null) {
            document.getElementById("generator").value = generator;
        }
        onGeneratorChange();
    });
});

for (let input of document.getElementsByTagName("input")) {
    input.addEventListener("input", onInput);
}

function onInput(event) {
    let target;
    if (event === undefined) {
        target = document.getElementById("seed");
    } else {
        target = event.target;
    }
    target.classList.remove("missing");
    document.getElementById("error").innerHTML = "";

    let generator = document.getElementById("generator").value;
    let shareLink = document.getElementById("share-link");
    let query = "?";
    for (let input of document.getElementsByTagName("input")) {
        if (input.dataset.generator != undefined && input.dataset.generator != generator) {
            continue;
        }
        if (input.id === "player") {
            continue;
        }
        if (input.type == "checkbox") {
            if (input.checked) {
                query += input.id + "&";
            }
            continue;
        }
        if (input.value.length > 0) {
            query += input.id + "=" + input.value + "&";
        }
    }
    query = query.substring(0, query.length - 1);
    shareLink.href = window.location.origin + window.location.pathname + query;
    shareLink.innerHTML = shareLink.href.replace(/&/g, "&amp;");
}

document.getElementById("generator").addEventListener("change", onGeneratorChange);

function onGeneratorChange() {
    for (let element of document.querySelectorAll("[data-generator]")) {
        if (element.dataset.generator == document.getElementById("generator").value) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    }
    onInput();
}

function rollSeed() {
    let seed = document.getElementById("seed");
    seed.value = Math.floor(Math.random() * 1000000).toString();
    setRandomSeed(parseInt(seed.value));
    onInput();
}

const regularFuncs = {
    "games": function (x) { return x.value.split(/[,，]\s*/); },
    "ranks": function (x) { return x.value.split(/[,，]\s*/).map(function (item) { return parseInt(item); }); },
    "seed": function (x) { return parseInt(x.value); },
    // "balance": function (x) { return x.checked; },
    "center": function (x) { return x.checked; },
    "room": function (x) { return x.value; },
    "player": function (x) { return x.value; }
};

function parseSettings() {
    let settings = {};
    for (let setting in regularFuncs) {
        let regularFunc = regularFuncs[setting];
        let element = document.getElementById(setting);
        settings[setting] = regularFunc(element);
        if (element.type == "text" && element.value.length == 0) {
            if (setting === "room") {
                let playerInput = document.getElementById("player");
                if (playerInput.value.length == 0) {
                    continue;
                }
            } else if (setting === "player") {
                let roomInput = document.getElementById("room");
                if (roomInput.value.length == 0) {
                    continue;
                }
            }
            let associatedLabel = document.querySelector(`label[for="${setting}"]`);
            let error = document.getElementById("error");
            error.innerHTML = "*" + associatedLabel.innerText + "必填";
            element.classList.add("missing");
            return;
        }
    }
    return settings
}

function createOrJoinRoom() {
    let settings = parseSettings();
    if (settings === undefined) {
        return;
    }
    setRandomSeed(settings["seed"]);
    let card;
    try {
        card = rankCardGenerator.generate(data, settings["games"], settings["ranks"], false, settings["center"]);
    } catch (error) {
        document.getElementById("error").innerHTML = "*" + error.message;
        return;
    }
    let params = "id=" + card.map(id => id).join(",");
    if (settings["player"].length > 0) {
        params += "&" + new URLSearchParams({ "player": settings["player"] }).toString();
    }
    if (settings["room"].length > 0) {
        params += "&" + new URLSearchParams({ "room": settings["room"] }).toString();
    }
    if (settings["games"].length > 1) {
        params += "&multi";
    }
    window.open('popup.html?' + params, 'Bingo', 'width=800,height=800');
}

document.getElementById("createJoinButton").addEventListener("click", createOrJoinRoom);
document.getElementById("rollButton").addEventListener("click", rollSeed);
