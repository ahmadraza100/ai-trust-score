"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectOverconfidence = detectOverconfidence;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const registry_1 = require("../core/registry");
let rules = [];
try {
    const p = path_1.default.resolve(__dirname, 'patterns.json');
    if (fs_1.default.existsSync(p)) {
        const raw = fs_1.default.readFileSync(p, 'utf-8');
        const json = JSON.parse(raw);
        rules = json.overconfidence || [];
    }
}
catch (e) {
    // ignore
}
function detectOverconfidence(text, config) {
    const issues = [];
    let count = 0;
    const merged = [...rules];
    try {
        if (config && config.customRules && Array.isArray(config.customRules['overconfidence'])) {
            merged.push(...config.customRules['overconfidence']);
        }
    }
    catch (e) { }
    for (const r of merged) {
        try {
            const re = new RegExp(r.pattern, r.flags || 'i');
            const m = text.match(re);
            if (m) {
                count += 1;
                issues.push({ type: r.type || 'confidence', severity: r.severity, message: `${r.message} "${m[0]}"` });
            }
        }
        catch (e) {
            // ignore
        }
    }
    if (count > 1) {
        issues.push({ type: 'confidence', severity: 'medium', message: `${count} strong certainty markers found.` });
    }
    return issues;
}
(0, registry_1.registerDetector)('overconfidence', (text, config) => detectOverconfidence(text, config));
