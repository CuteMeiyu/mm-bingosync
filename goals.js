async function loadData() {
    const response = await fetch("data.csv");
    const text = await response.text();
    const data = await new Promise((resolve) => {
        Papa.parse(text, {
            header: true,
            complete: function (results) {
                resolve(results.data);
            },
        });
    });
    data.pop()
    for (let i = 0; i < data.length; i++) {
        let goal = data[i];
        goal.index = i;
        goal.games = goal.games == "" ? [] : goal.games.split(",").map((game) => game.trim());
        goal.groups = goal.groups == "" ? [] : goal.groups.split(",").map((group) => group.trim());
        goal.pw = goal.pw == "y" ? "可以从城堡1开始" : goal.pw
        goal.rank = parseInt(goal.rank) - 1;
        if (goal.type.startsWith("any")) {
            goal.minGameIntersection = parseInt(goal.type.substring(3));
            goal.minGameIntersection = isNaN(goal.minGameIntersection) ? 1 : goal.minGameIntersection;
        } else {
            goal.minGameIntersection = goal.games.length;
        }
        goal.weight = goal.weight == "" ? 1.0 : parseFloat(goal.weight);
    }
    return data;
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

function drawGoal(goals) {
    let totalWeight = 0;
    for (let i = 0; i < goals.length; i++) {
        let goal = goals[i];
        totalWeight += goal.weight;
    }
    if (totalWeight == 0) {
        return null;
    }
    let weight = random() * totalWeight;
    for (let i = 0; i < goals.length; i++) {
        weight -= goals[i].weight;
        if (weight < 0) {
            return goals.splice(i, 1)[0];
        }
    }
    return null;
}
