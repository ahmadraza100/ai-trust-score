import { GuardConfig, GuardReport } from "../types";
import '../detectors/hallucination';
import '../detectors/overconfidence';
import '../detectors/numeric';
import '../detectors/inconsistency';
export declare function validateLLM(output: string | object, config?: GuardConfig): GuardReport;
