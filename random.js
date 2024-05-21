var randomSeed = Date.now();

function random() {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    randomSeed = (a * randomSeed + c) % m;
    return randomSeed / m;
}

function setRandomSeed(seed) {
    randomSeed = seed;
}

export { random, setRandomSeed }
