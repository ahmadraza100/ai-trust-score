"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLLM = validateLLM;
const validator_1 = require("../schema/validator");
const registry_1 = require("./registry");
const score_1 = require("./score");
const pkginfo = require('../../package.json');
// Import detectors for side-effects so they register themselves with the registry
require("../detectors/hallucination");
require("../detectors/overconfidence");
require("../detectors/numeric");
require("../detectors/inconsistency");
function validateLLM(output, config = {}) {
    const issues = [];
    // If object and schema provided, run JSON Schema validation
    if (config.schema && typeof output === 'object') {
        const res = (0, validator_1.validateSchema)(output, config.schema);
        if (!res.valid) {
            for (const msg of res.errors) {
                issues.push({ type: 'schema', severity: 'high', message: msg });
            }
        }
    }
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    // Run registered detectors (they decide internally whether to run given config)
    issues.push(...(0, registry_1.runDetectors)(text, config));
    // (for debugging) you can inspect available detectors via listDetectors()
    // const available = listDetectors();
    const score = (0, score_1.computeScore)(issues);
        // Minimal response by default to keep integration simple and compact.
        // If caller sets config.verbose === true, include summary/meta/config for debugging.
        const minimal = {
            ok: issues.length === 0,
            score,
            issues
        };
        if (config && config.verbose) {
            const summary = `Detected ${issues.length} issue(s). Trust score ${score}/100.`;
            const detectors = (() => {
                try {
                    return (0, registry_1.listDetectors)();
                }
                catch (e) {
                    return [];
                }
            })();
            return {
                ...minimal,
                summary,
                meta: {
                    timestamp: new Date().toISOString(),
                    inputType: typeof output,
                    packageVersion: pkginfo.version || null,
                    detectors
                },
                config: config || {}
            };
        }
        return minimal;
}
