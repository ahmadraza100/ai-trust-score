import { Issue } from "../types";
import { GuardConfig } from '../types';
export declare function detectHallucination(text: string, config?: GuardConfig): Issue[];
