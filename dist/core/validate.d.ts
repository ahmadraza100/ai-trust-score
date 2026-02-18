export const __esModule: boolean;
export function validateLLM(output: any, config?: {}): {
    score: number;
    issues: (import("..").Issue | {
        type: string;
        severity: string;
        message: string;
    })[];
    summary: string;
};
