"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndDecide = validateAndDecide;
exports.llmGuardMiddleware = llmGuardMiddleware;
const validate_1 = require("./validate");
/**
 * Helper to validate a single output and decide whether to allow it.
 * Returns { allowed, report } where allowed is true when score >= threshold.
 */
function validateAndDecide(output, config = {}, threshold = 70) {
    const report = (0, validate_1.validateLLM)(output, config);
    return { allowed: report.score >= threshold, report };
}
/**
 * Express middleware factory example (lightweight):
 * Use `app.post('/generate', llmGuardMiddleware({ threshold: 80 }), handler)`
 * The middleware expects `req.body.output` (string) and will attach `req.llmGuardReport`.
 */
function llmGuardMiddleware(opts = {}) {
    const threshold = opts.threshold ?? 70;
    const config = opts.config ?? {};
    return (req, res, next) => {
        try {
            const text = req.body && req.body.output;
            if (!text)
                return next();
            const { allowed, report } = validateAndDecide(text, config, threshold);
            req.llmGuardReport = report;
            if (!allowed) {
                return res.status(422).json({ error: 'Output failed VerifAI validation', report });
            }
            next();
        }
        catch (e) {
            next(e);
        }
    };
}
