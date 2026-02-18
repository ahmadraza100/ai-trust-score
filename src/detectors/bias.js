"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBiasLanguage = detectBiasLanguage;
const registry_1 = require("../core/registry");

function detectBiasLanguage(text, config) {
    const issues = [];
    // Load configurable bias patterns from patterns.json and from config.customRules
    const textUtils = require('../core/text');
    const fs = require('fs');
    const path = require('path');
    let rules = [];
    try {
        const p = path.resolve(__dirname, 'patterns.json');
        if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf-8');
            const json = JSON.parse(raw);
            if (Array.isArray(json.bias)) rules.push(...json.bias);
        }
    }
    catch (e) { /* ignore */ }
    try {
        if (config && config.customRules && Array.isArray(config.customRules['bias'])) {
            rules.push(...config.customRules['bias']);
        }
    }
    catch (e) { /* ignore */ }
    // rules may contain simple patterns; use fuzzy matching for robustness
    const phrases = [];
    for (const r of rules) {
        if (r.pattern)
            phrases.push(r.pattern.replace(/^\\b|\\b$/g, '').replace(/\\b/g, ''));
    }
    // fallback to a small built-in list if no rules found
    if (phrases.length === 0) {
        phrases.push('obviously', 'no doubt', 'they are criminals', 'they are terrorists');
    }
    const matches = textUtils.containsAnyFuzzy(text, phrases);
    for (const m of matches) {
        // find rule to supply severity/message if present
        const matchedRule = rules.find(r => r.pattern && textUtils.fuzzyIncludes(text, r.pattern));
        if (matchedRule) {
            issues.push({ type: matchedRule.type || 'bias', severity: matchedRule.severity || 'low', message: matchedRule.message || `Loaded or emotionally charged phrase detected: "${m}"` });
        }
        else {
            issues.push({ type: 'bias', severity: 'low', message: `Loaded or emotionally charged phrase detected: "${m}"` });
        }
    }
    return issues;
}
(0, registry_1.registerDetector)('bias', (text, config) => detectBiasLanguage(text, config));
