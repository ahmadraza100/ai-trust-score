"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectInconsistency = detectInconsistency;
const opposites = {
    'cost': ['increase', 'decrease', 'reduces', 'increases'],
    'costs': ['increase', 'decrease', 'reduces', 'increases'],
    'growth': ['increase', 'decrease', 'fell', 'rose'],
    'reduce': ['reduce', 'increase', 'increases', 'reduces']
};
function detectInconsistency(text, config) {
    const issues = [];
    const sentences = text.split(/[\.\n\!\?]+/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < sentences.length; i++) {
        for (let j = i + 1; j < Math.min(sentences.length, i + 6); j++) {
            const a = sentences[i].toLowerCase();
            const b = sentences[j].toLowerCase();
            for (const key of Object.keys(opposites)) {
                if (a.includes(key) && (a.includes('increase') || a.includes('decrease') || a.includes('reduce') || a.includes('reduce'))) {
                    // check b for opposite word
                    if ((b.includes('increase') || b.includes('increases') || b.includes('rose')) && (a.includes('decrease') || a.includes('fell') || a.includes('reduce'))) {
                        issues.push({ type: 'inconsistency', severity: 'high', message: `Contradicting statements between sentences: "${sentences[i]}" vs "${sentences[j]}"` });
                    }
                    if ((b.includes('decrease') || b.includes('fell') || b.includes('reduce')) && (a.includes('increase') || a.includes('increases') || a.includes('rose'))) {
                        issues.push({ type: 'inconsistency', severity: 'high', message: `Contradicting statements between sentences: "${sentences[i]}" vs "${sentences[j]}"` });
                    }
                }
            }
        }
    }
    return issues;
}
const registry_1 = require("../core/registry");
(0, registry_1.registerDetector)('inconsistency', (text) => detectInconsistency(text));
