import { random } from "../random.js";
import { goalGamesCheck, goalGroupsCheck, drawGoal } from "../goals.js";


function calculateError(matrix) {
    let diffs = [];
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        let rowSum = 0;
        let colSum = 0;
        for (let j = 0; j < n; j++) {
            rowSum += matrix[i][j].diff;
            colSum += matrix[j][i].diff;
        }
        diffs.push(rowSum, colSum);
    }

    let diag1Sum = 0;
    let diag2Sum = 0;
    for (let i = 0; i < n; i++) {
        diag1Sum += matrix[i][i].diff;
        diag2Sum += matrix[i][n - 1 - i].diff;
    }
    diffs.push(diag1Sum, diag2Sum);

    let mean = diffs.reduce((a, b) => a + b) / diffs.length;
    let variance = diffs.reduce((a, b) => a + (b - mean) * (b - mean)) / diffs.length;

    return variance;
}

function optimize(matrix, centerFixed, initialTemp = 10.0, endTemp = 0.002, coolingRate = 0.998) {
    const n = matrix.length;
    let currentMatrix = matrix.map(row => row.slice());
    let currentError = calculateError(currentMatrix);
    let temp = initialTemp;

    while (temp > endTemp) {
        let i1 = Math.floor(random() * n);
        let j1 = Math.floor(random() * n);
        let i2 = Math.floor(random() * n);
        let j2 = Math.floor(random() * n);
        if (i1 == i2 && j1 == j2) {
            continue;
        }
        if (centerFixed && (i1 == 2 && j1 == 2) || (i2 == 2 && j2 == 2)) {
            continue;
        }
        let newMatrix = currentMatrix.map(row => row.slice());
        [newMatrix[i1][j1], newMatrix[i2][j2]] = [newMatrix[i2][j2], newMatrix[i1][j1]];
        let newError = calculateError(newMatrix);
        if (newError < currentError || Math.exp((currentError - newError) / temp) > random()) {
            currentMatrix = newMatrix;
            currentError = newError;
        }
        temp *= coolingRate;
    }
    return currentMatrix;
}

function generateCard(goals, centerFixed) {
    let matrix = [[], [], [], [], []];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            matrix[row][col] = goals[row * 5 + col];
        }
    }
    console.log("Error:", calculateError(matrix));
    let optimizedMatrix = optimize(matrix, centerFixed);
    console.log("Optimized Error:", calculateError(optimizedMatrix));
    return optimizedMatrix.flat().map(goal => goal.index);
}

function argmax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function generate(goals, games, averageDiff, minDiff, maxDiff, centerHardest) {
    let filterGoals = goals.filter(goal => goalGamesCheck(goal, games) && (minDiff == undefined || goal.diff >= minDiff) && (maxDiff == undefined || goal.diff <= maxDiff));
    filterGoals.sort((a, b) => a.diff - b.diff);
    let usedGoals = [];
    let usedGroups = [];
    let usedAverage = null;
    let gamesCount = {};
    for (let game of games) {
        gamesCount[game] = 0;
    }
    let leniencyConditions = ["无", "允许同组任务同时出现"];

    for (let leniency = 0; leniency < leniencyConditions.length; leniency++) {
        if (leniency > 0) {
            console.log(`任务数量不足，尝试放宽条件：${leniencyConditions[leniency]}`);
        }
        let goalsRemain = [...filterGoals];
        while (goalsRemain.length > 0) {
            let goal = null;
            if (usedAverage == null || averageDiff == NaN) {
                goal = drawGoal(goalsRemain);
            } else if (usedAverage > averageDiff) {
                goal = drawGoal(goalsRemain, 0.0, averageDiff);
            } else {
                goal = drawGoal(goalsRemain, averageDiff);
            }
            if (goal === null) {
                break;
            }
            if (leniency < 1 && !goalGroupsCheck(goal, usedGroups)) {
                continue;
            }
            // if (balanceGames) {
            //     for (let game of goal.games) {
            //         gamesCount[game] += 1;
            //     }
            //     gamesCountValues = Object.values(gamesCount)
            //     if (Math.max(...gamesCountValues) - Math.min(...gamesCountValues) > 1) {
            //         for (let game of goal.games) {
            //             gamesCount[game] -= 1;
            //         }
            //         continue;
            //     }
            // }
            usedGroups = usedGroups.concat(goal.groups);
            if (usedAverage == null) {
                usedAverage = goal.diff;
            } else {
                usedAverage = (usedAverage * usedGoals.length + goal.diff) / (usedGoals.length + 1);
            }
            usedGoals.push(goal);
            if (usedGoals.length >= 25) {
                if (centerHardest) {
                    let maxIndex = argmax(usedGoals.map(goal => goal.diff));
                    [usedGoals[12], usedGoals[maxIndex]] = [usedGoals[maxIndex], usedGoals[12]];
                }
                return generateCard(usedGoals, centerHardest);
            }
        }
    }
    throw new Error("没有足够数量的符合条件的任务");
}

export default { generate }
