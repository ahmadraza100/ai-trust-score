#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const validate_1 = require("./core/validate");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
function printUsage() {
    console.log(chalk_1.default.bold('ai-trust-score CLI'));
    console.log('Usage: ai-trust-score check --file <path> [--threshold <number>]');
    console.log('Or: cat output.txt | ai-trust-score check --stdin');
}
function colorForSeverity(s) {
    if (s === 'high')
        return chalk_1.default.red;
    if (s === 'medium')
        return chalk_1.default.yellow;
    return chalk_1.default.gray;
}
async function main() {
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
        printUsage();
        process.exit(1);
    }
    const cmd = argv[0];
    const args = argv.slice(1);
    if (cmd !== 'check') {
        printUsage();
        process.exit(1);
    }
    let file;
    let useStdin = false;
    let threshold = 0;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--file' && args[i + 1]) {
            file = args[i + 1];
            i++;
        }
        else if (a === '--stdin') {
            useStdin = true;
        }
        else if (a === '--threshold' && args[i + 1]) {
            threshold = parseInt(args[i + 1], 10);
            i++;
        }
    }
    let input = '';
    if (useStdin) {
        input = fs_1.default.readFileSync(0, 'utf-8');
    }
    else if (file) {
        const p = path_1.default.resolve(process.cwd(), file);
        if (!fs_1.default.existsSync(p)) {
            console.error(chalk_1.default.red(`File not found: ${p}`));
            process.exit(2);
        }
        input = fs_1.default.readFileSync(p, 'utf-8');
    }
    else {
        console.error(chalk_1.default.red('No input: provide --file or --stdin'));
        process.exit(2);
    }
    // Try to parse JSON, otherwise pass as text
    let parsed = input;
    try {
        parsed = JSON.parse(input);
    }
    catch (e) { /* leave as string */ }
    const report = (0, validate_1.validateLLM)(parsed, { numericConsistency: true, hallucinationCheck: true, overconfidenceCheck: true });
    // Pretty output
    console.log(chalk_1.default.bold(`Trust score: ${report.score}/100`));
    console.log(chalk_1.default.dim(report.summary));
    if (report.issues.length === 0) {
        console.log(chalk_1.default.green('No issues detected.'));
    }
    else {
        const table = new cli_table3_1.default({ head: ['Type', 'Severity', 'Message'] });
        for (const it of report.issues) {
            const color = colorForSeverity(it.severity);
            table.push([it.type, color(it.severity), it.message]);
        }
        console.log(table.toString());
    }
    if (threshold && report.score < threshold) {
        process.exit(3);
    }
}
main().catch(err => {
    console.error(err);
    process.exit(10);
});
