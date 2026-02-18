export type Severity = 'low' | 'medium' | 'high';
export type IssueType = 'hallucination' | 'schema' | 'numeric' | 'confidence' | 'inconsistency';
export interface Issue {
    type: IssueType;
    severity: Severity;
    message: string;
    location?: string;
}
export interface GuardReport {
    score: number;
    issues: Issue[];
    summary: string;
}
export interface GuardConfig {
    schema?: object;
    requiredSections?: string[];
    numericConsistency?: boolean;
    hallucinationCheck?: boolean;
    overconfidenceCheck?: boolean;
    maxConfidenceWithoutEvidence?: number;
    customRules?: Record<string, Array<Record<string, any>>>;
}
