"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectHallucination = detectHallucination;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const registry_1 = require("../core/registry");
let rules = [];
try {
    const p = path_1.default.resolve(__dirname, 'patterns.json');
    if (fs_1.default.existsSync(p)) {
        const raw = fs_1.default.readFileSync(p, 'utf-8');
        const json = JSON.parse(raw);
        rules = json.hallucination || [];
    }
}
catch (e) {
    // ignore rule loading errors
}
function detectHallucination(text, config) {
    const issues = [];
    // combine built-in rules with custom rules from config
    const merged = [...rules];
    try {
        if (config && config.customRules && Array.isArray(config.customRules['hallucination'])) {
            merged.push(...config.customRules['hallucination']);
        }
    }
    catch (e) { /* ignore */ }
    const textUtils = require('../core/text');
    for (const r of merged) {
        try {
            // try regex first
            const re = new RegExp(r.pattern, r.flags || 'i');
            if (re.test(text)) {
                issues.push({ type: r.type || 'hallucination', severity: r.severity, message: r.message });
                continue;
            }
            // best-effort: extract literal alternatives like (A|B|C) from pattern and fuzzy-match them
            const alt = (r.pattern.match(/\(([^)]+)\)/) || [null, null])[1];
            if (alt) {
                const parts = alt.split('|').map(s => s.replace(/\\b/g, '').replace(/\\/g, '').trim()).filter(Boolean);
                const matches = textUtils.containsAnyFuzzy(text, parts);
                if (matches.length > 0) {
                    issues.push({ type: r.type || 'hallucination', severity: r.severity, message: r.message });
                }
            }
        }
        catch (e) {
            // skip invalid pattern
        }
    }
    // small fallback heuristic for institutions
    const instRe = /([A-Z][a-z]+ (Institute|University|Center|Lab|Academy))/g;
    let m;
    while ((m = instRe.exec(text))) {
        const name = m[1];
        issues.push({ type: 'hallucination', severity: 'low', message: `Named institution detected: ${name}` });
    }
    return issues;
}
// register with registry so validateLLM picks it up automatically
(0, registry_1.registerDetector)('hallucination', (text, config) => detectHallucination(text, config));
