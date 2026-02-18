"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Improved generator: creates varied samples by altering numbers and certainty phrases
function usage() { console.log('Usage: generate_samples <count> <out.jsonl>'); }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function makeSample(i, base) {
    // variations: replace percentage, numbers, and certainty phrases
    const pct = Math.floor(Math.random() * 80) + 1; // 1-80%
    const a = Math.floor(50 + Math.random() * 200);
    const b = Math.floor(a + (Math.random() * a));
    const cert = randChoice(['Definitely', 'Probably', 'It seems', 'Experts say', 'Without a doubt', 'Research shows']);
    // build a sentence emulating the base
    const text = `${cert} the product revenue grew ${pct}% from ${a} to ${b}. ${randChoice(['This is the best outcome.', 'This is an expected result.', 'This is surprising.'])}`;
    return { id: i + 1, text };
}
function main() {
    const argv = process.argv.slice(2);
    if (argv.length < 2) {
        usage();
        process.exit(1);
    }
    const count = parseInt(argv[0], 10);
    const out = path_1.default.resolve(process.cwd(), argv[1]);
    if (isNaN(count) || count <= 0) {
        console.error('count must be > 0');
        process.exit(2);
    }
    const stream = fs_1.default.createWriteStream(out, { encoding: 'utf-8' });
    for (let i = 0; i < count; i++) {
        const obj = makeSample(i, '');
        stream.write(JSON.stringify(obj) + '\n');
    }
    stream.end();
    console.log(`Wrote ${count} samples to ${out}`);
}
main();
