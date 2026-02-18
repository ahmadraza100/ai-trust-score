"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectUnsupportedClaims = detectUnsupportedClaims;
const registry_1 = require("../core/registry");

function detectUnsupportedClaims(text, config) {
    const issues = [];
    // Find numeric claims (numbers, percents, large numbers)
    const numRe = /\b\d{1,3}(?:[\d,]*\d)?(?:\.\d+)?(?:%| percent)?\b/g;
    // gather source markers from patterns.json or config
    const fs = require('fs');
    const path = require('path');
    let sourcePatterns = [/\b(according to|reported by|per the report|source:|source is|as reported)\b/i];
    try {
        const p = path.resolve(__dirname, 'patterns.json');
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf-8');
            const json = JSON.parse(raw);
            if (Array.isArray(json.claims)) {
                for (const r of json.claims) {
                    if (r.pattern) sourcePatterns.push(new RegExp(r.pattern, r.flags || 'i'));
                }
            }
            if (Array.isArray(json.source)) {
                for (const r of json.source) {
                    if (r.pattern) sourcePatterns.push(new RegExp(r.pattern, r.flags || 'i'));
                }
            }
        }
    }
    catch (e) { }
    try {
        if (config && config.customRules && Array.isArray(config.customRules['claims'])) {
            for (const r of config.customRules['claims']) {
                if (r.pattern) sourcePatterns.push(new RegExp(r.pattern, r.flags || 'i'));
            }
        }
    }
    catch (e) { }
    // check for presence of explicit source markers near the number
    const textUtils = require('../core/text');
    let m;
    while ((m = numRe.exec(text))) {
        const idx = m.index;
        const window = text.slice(Math.max(0, idx - 80), Math.min(text.length, idx + 80));
        let hasSource = false;
        for (const sp of sourcePatterns) {
            if (sp.test(window)) { hasSource = true; break; }
        }
        if (!hasSource) {
            issues.push({ type: 'claim', severity: 'low', message: `Numeric/factual claim without explicit source near: "${m[0]}"` });
        }
    }
    return issues;
}
(0, registry_1.registerDetector)('claims', (text, config) => detectUnsupportedClaims(text, config));
