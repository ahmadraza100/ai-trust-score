"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const validate_1 = require("./core/validate");
// lightweight replacements for chalk and cli-table3 to avoid extra dependencies
const chalk_1 = {
    default: {
        bold: (s) => s,
        red: (s) => s,
        yellow: (s) => s,
        gray: (s) => s,
        dim: (s) => s,
        green: (s) => s,
    }
};

function makeTable(rows, head) {
    const cols = head || [];
    const lines = [];
    if (cols.length) {
        lines.push(cols.join(' | '));
        lines.push(cols.map(() => '---').join(' | '));
    }
    for (const r of rows) {
        lines.push(r.map(String).join(' | '));
    }
    return lines.join('\n');
}
async function runDemo() {
    const p = path_1.default.resolve(process.cwd(), 'examples', 'sample_output.txt');
    if (!fs_1.default.existsSync(p)) {
        console.error(chalk_1.default.red('demo example not found:'), p);
        process.exit(2);
    }
    const input = fs_1.default.readFileSync(p, 'utf-8');
    const report = (0, validate_1.validateLLM)(input, { numericConsistency: true, hallucinationCheck: true, overconfidenceCheck: true });
    console.log(chalk_1.default.bold('--- ai-trust-score demo output ---'));
    console.log(chalk_1.default.bold(`Trust score: ${report.score}/100`));
    console.log(chalk_1.default.dim(report.summary));
    if (report.issues.length === 0) {
        console.log(chalk_1.default.green('No issues detected.'));
    }
    else {
        const rows = [];
        for (const it of report.issues) {
            const color = it.severity === 'high' ? chalk_1.default.red : it.severity === 'medium' ? chalk_1.default.yellow : chalk_1.default.gray;
            rows.push([it.type, color(it.severity), it.message]);
        }
        console.log(makeTable(rows, ['Type', 'Severity', 'Message']));
    }
}
runDemo().catch(e => { console.error(e); process.exit(1); });
