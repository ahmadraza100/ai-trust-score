import { Issue, GuardConfig } from '../types';
export type DetectorFn = (text: string, config: GuardConfig) => Issue[];
export declare function registerDetector(name: string, fn: DetectorFn): void;
export declare function runDetectors(text: string, config: GuardConfig): Issue[];
export declare function listDetectors(): string[];
