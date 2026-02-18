"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDetector = registerDetector;
exports.runDetectors = runDetectors;
exports.listDetectors = listDetectors;
const detectors = [];
function registerDetector(name, fn) {
    detectors.push({ name, fn });
}
function runDetectors(text, config) {
    const issues = [];
    for (const d of detectors) {
        try {
            const res = d.fn(text, config);
            if (Array.isArray(res) && res.length)
                issues.push(...res);
        }
        catch (err) {
            // detector error should not crash pipeline
            issues.push({ type: 'schema', severity: 'low', message: `Detector ${d.name} failed: ${String(err)}` });
        }
    }
    return issues;
}
function listDetectors() {
    return detectors.map(d => d.name);
}
