import { random } from "./random.js";

async function readDataJson() {
    const response = await fetch('data.json?' + new Date().getTime());
    const data = await response.json();
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        item.index = i;
        if (item.games === undefined) {
            item.games = [];
        }
        if (item.groups === undefined) {
            item.groups = [];
        }
        if (item.rank === undefined) {
            item.rank = 0;
        }
        if (item.diff === undefined) {
            item.diff = 0.0;
        }
        if (item.weight === undefined) {
            item.weight = 1.0;
        }
        if (item.type !== undefined && item.type.startsWith("any")) {
            item.minGameIntersection = parseInt(item.type.substring(3));
            item.minGameIntersection = isNaN(item.minGameIntersection) ? 1 : item.minGameIntersection;
        } else {
            item.minGameIntersection = item.games.length;
        }
    }
    return data;
}

function getIntersection(setA, setB) {
    return setA.filter(item => setB.includes(item));
}

function goalGamesCheck(goal, games) {
    let intersectionCount;
    if (goal.games.length == 0) {
        intersectionCount = games.length;
    } else {
        intersectionCount = getIntersection(goal.games, games).length;
    }
    return intersectionCount >= goal.minGameIntersection;
}

function goalGroupsCheck(goal, usedGroups) {
    return getIntersection(goal.groups, usedGroups).length == 0;
}

function drawGoal(goals, minDiff, maxDiff) {
    let totalWeight = 0;
    let started = false;
    let startIndex;
    let endIndex;
    for (let i = 0; i < goals.length; i++) {
        let goal = goals[i];
        if (minDiff != undefined && goal.diff < minDiff) {
            continue;
        }
        if (!started) {
            startIndex = i;
            started = true;
        }
        if (maxDiff != undefined && goal.diff > maxDiff) {
            endIndex = i;
            break;
        }
        totalWeight += goal.weight;
    }
    if (totalWeight == 0 || !started) {
        return null;
    }
    if (endIndex == undefined) {
        endIndex = goals.length;
    }
    let weight = random() * totalWeight;
    for (let i = startIndex; i < endIndex; i++) {
        weight -= goals[i].weight;
        if (weight < 0) {
            return goals.splice(i, 1)[0];
        }
    }
    return null;
}

export { readDataJson, goalGamesCheck, goalGroupsCheck, drawGoal };
