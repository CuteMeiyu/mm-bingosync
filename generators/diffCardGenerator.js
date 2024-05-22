import { random } from "../random.js";
import { goalGamesCheck, goalGroupsCheck, drawGoal } from "../goals.js";


function calculateError(matrix, targetSum) {
    let error = 0;
    const n = matrix.length;

    for (let i = 0; i < n; i++) {
        let rowSum = 0;
        let colSum = 0;
        for (let j = 0; j < n; j++) {
            rowSum += matrix[i][j].diff;
            colSum += matrix[j][i].diff;
        }
        error += (rowSum - targetSum) * (rowSum - targetSum) + (colSum - targetSum) * (colSum - targetSum);
    }

    let diag1Sum = 0;
    let diag2Sum = 0;
    for (let i = 0; i < n; i++) {
        diag1Sum += matrix[i][i].diff;
        diag2Sum += matrix[i][n - 1 - i].diff;
    }
    error += (diag1Sum - targetSum) * (diag1Sum - targetSum) + (diag2Sum - targetSum) * (diag2Sum - targetSum);

    return error;
}

function optimizeSimulatedAnnealing(matrix, targetSum, centerFixed, initialTemp = 100.0, coolingRate = 0.997) {
    const n = matrix.length;
    let currentMatrix = matrix.map(row => row.slice());
    let currentError = calculateError(currentMatrix, targetSum);
    let temp = initialTemp;

    while (temp > 1.0) {
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
        let newError = calculateError(newMatrix, targetSum);
        if (newError < currentError || Math.exp((currentError - newError) / temp) > random()) {
            currentMatrix = newMatrix;
            currentError = newError;
        }
        temp *= coolingRate;
    }
    return currentMatrix;
}

function optimize(matrix, targetSum, centerFixed) {
    const n = matrix.length;
    let currentMatrix = matrix.map(row => row.slice());
    let currentError = calculateError(currentMatrix, targetSum);
    let improved = true;

    while (improved) {
        improved = false;
        for (let i1 = 0; i1 < n; i1++) {
            for (let j1 = 0; j1 < n; j1++) {
                for (let i2 = 0; i2 < n; i2++) {
                    for (let j2 = 0; j2 < n; j2++) {
                        if (i1 !== i2 || j1 !== j2) {
                            if (centerFixed && (i1 === 2 && j1 === 2) || (i2 === 2 && j2 === 2)) {
                                continue;
                            }
                            let newMatrix = currentMatrix.map(row => row.slice());
                            [newMatrix[i1][j1], newMatrix[i2][j2]] = [newMatrix[i2][j2], newMatrix[i1][j1]];
                            let newError = calculateError(newMatrix, targetSum);
                            if (newError < currentError) {
                                currentMatrix = newMatrix;
                                currentError = newError;
                                improved = true;
                            }
                        }
                    }
                }
            }
        }
    }

    return currentMatrix;
}

function generateCard(goals, targetAverage, centerFixed) {
    let matrix = [[], [], [], [], []];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            matrix[row][col] = goals[row * 5 + col];
        }
    }
    let targetSum = targetAverage * 5;
    console.log("Target Sum:", targetSum);
    console.log("Error:", calculateError(matrix, targetSum));
    let optimizedMatrix = optimize(matrix, targetSum, centerFixed);
    console.log("Optimized Error:", calculateError(optimizedMatrix, targetSum));
    // let optimizedMatrixAnnealing = optimizeSimulatedAnnealing(matrix, targetSum, centerFixed);
    // console.log("Optimized Error (SA):", calculateError(optimizedMatrixAnnealing, targetSum));
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
                return generateCard(usedGoals, usedAverage, centerHardest);
            }
        }
    }
    throw new Error("没有足够数量的符合条件的任务");
}

export default { generate }
