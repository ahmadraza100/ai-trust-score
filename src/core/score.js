"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScore = computeScore;
const penaltyBySeverity = {
    high: 15,
    medium: 8,
    low: 3,
};
function computeScore(issues) {
    let score = 100;
    for (const it of issues) {
        const p = penaltyBySeverity[it.severity] ?? 0;
        score -= p;
    }
    if (score < 0)
        score = 0;
    return score;
}
