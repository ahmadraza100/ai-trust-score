import { GuardConfig, GuardReport } from '../types';
/**
 * Helper to validate a single output and decide whether to allow it.
 * Returns { allowed, report } where allowed is true when score >= threshold.
 */
export declare function validateAndDecide(output: string | object, config?: GuardConfig, threshold?: number): {
    allowed: boolean;
    report: GuardReport;
};
/**
 * Express middleware factory example (lightweight):
 * Use `app.post('/generate', llmGuardMiddleware({ threshold: 80 }), handler)`
 * The middleware expects `req.body.output` (string) and will attach `req.llmGuardReport`.
 */
export declare function llmGuardMiddleware(opts?: {
    threshold?: number;
    config?: GuardConfig;
}): (req: any, res: any, next: any) => any;
