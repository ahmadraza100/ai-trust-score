export const __esModule: boolean;
/**
 * Helper to validate a single output and decide whether to allow it.
 * Returns { allowed, report } where allowed is true when score >= threshold.
 */
export function validateAndDecide(output: any, config?: {}, threshold?: number): {
    allowed: boolean;
    report: import("..").GuardReport;
};
/**
 * Express middleware factory example (lightweight):
 * Use `app.post('/generate', llmGuardMiddleware({ threshold: 80 }), handler)`
 * The middleware expects `req.body.output` (string) and will attach `req.llmGuardReport`.
 */
export function llmGuardMiddleware(opts?: {}): (req: any, res: any, next: any) => any;
