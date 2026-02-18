"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSourceClaims = detectSourceClaims;
const registry_1 = require("../core/registry");

function detectSourceClaims(text, config) {
    const issues = [];
    // Load configurable source patterns from patterns.json and customRules
    const fs = require('fs');
    const path = require('path');
    let rules = [];
    try {
        const p = path.resolve(__dirname, 'patterns.json');
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf-8');
            const json = JSON.parse(raw);
            if (Array.isArray(json.source)) rules.push(...json.source);
        }
    }
    catch (e) { }
    try {
        if (config && config.customRules && Array.isArray(config.customRules['source'])) {
            rules.push(...config.customRules['source']);
        }
    }
    catch (e) { }
    for (const r of rules) {
        try {
            const re = new RegExp(r.pattern, r.flags || 'i');
            if (re.test(text)) {
                issues.push({ type: r.type || 'source', severity: r.severity || 'low', message: r.message || 'Vague source citation detected.' });
            }
        }
        catch (e) { }
    }
    return issues;
}
(0, registry_1.registerDetector)('source', (text, config) => detectSourceClaims(text, config));
