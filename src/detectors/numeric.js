"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNumeric = detectNumeric;
// Very small heuristic numeric checks: extracts simple number pairs and checks basic arithmetic
const registry_1 = require("../core/registry");
function detectNumeric(text, config) {
    const issues = [];
    // Detect patterns like "from X to Y" and check percent claims nearby
    const rangeRe = /from\s+(\d+(?:\.\d+)?)\s*(million|billion|k|m)?\s*to\s+(\d+(?:\.\d+)?)\s*(million|billion|k|m)?/i;
    const pctRe = /(\d{1,3}(?:\.\d+)?)%/g;
    const r = rangeRe.exec(text);
    if (r) {
        const a = parseFloat(r[1]);
        const b = parseFloat(r[3]);
        if (!isNaN(a) && !isNaN(b) && a > 0) {
            const implied = ((b - a) / a) * 100;
            // See if a nearby percent is claimed that differs by >5 percentage points
            const window = text.slice(Math.max(0, r.index - 100), Math.min(text.length, r.index + 200));
            const pcts = [];
            let m;
            while ((m = pctRe.exec(window))) {
                pcts.push(parseFloat(m[1]));
            }
            if (pcts.length > 0) {
                const nearest = pcts[0];
                if (Math.abs(nearest - implied) > 5) {
                    issues.push({ type: 'numeric', severity: 'medium', message: `Percentage ${nearest}% inconsistent with increase from ${a} to ${b} (~${implied.toFixed(1)}%).` });
                }
            }
        }
    }
    // Detect simple sum inconsistencies: look for "total" and list of numbers
    const totalRe = /total(?:ed|s|:)\s*(\$?\d[\d,\.kmbMKB]*)/i;
    const numsRe = /(\$?\d[\d,\.kmbMKB]*)/g;
    const tot = totalRe.exec(text);
    if (tot) {
        // crude: sum first three numbers and compare
        const window = text.slice(0, Math.min(text.length, tot.index));
        const nums = [];
        let m;
        while ((m = numsRe.exec(window)) && nums.length < 5) {
            const cleaned = m[1].replace(/[$,]/g, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed))
                nums.push(parsed);
        }
        const totalVal = parseFloat(tot[1].replace(/[$,]/g, ''));
        const sum = nums.reduce((s, x) => s + x, 0);
        if (nums.length >= 2 && Math.abs(sum - totalVal) / Math.max(1, totalVal) > 0.05) {
            issues.push({ type: 'numeric', severity: 'medium', message: `Listed components sum (${sum}) differs from claimed total (${totalVal}).` });
        }
    }
    return issues;
}
(0, registry_1.registerDetector)('numeric', (text) => detectNumeric(text));
