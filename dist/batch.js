"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const path_1 = __importDefault(require("path"));
const validate_1 = require("./core/validate");
function parseArgs() {
    const argv = process.argv.slice(2);
    const out = { parallel: 4 };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--file' && argv[i + 1]) {
            out.file = argv[++i];
        }
        else if (a === '--out' && argv[i + 1]) {
            out.out = argv[++i];
        }
        else if (a === '--parallel' && argv[i + 1]) {
            out.parallel = parseInt(argv[++i], 10);
        }
        else if (a === '--html' && argv[i + 1]) {
            out.html = argv[++i];
        }
    }
    return out;
}
async function processFile(file, outPath, parallel = 4) {
    const abs = path_1.default.resolve(process.cwd(), file);
    if (!fs_1.default.existsSync(abs))
        throw new Error('File not found: ' + abs);
    const rl = readline_1.default.createInterface({ input: fs_1.default.createReadStream(abs), crlfDelay: Infinity });
    const outStream = outPath ? fs_1.default.createWriteStream(path_1.default.resolve(process.cwd(), outPath), { encoding: 'utf-8' }) : null;
    const htmlRows = [];
    let total = 0;
    let sumScore = 0;
    const typeCounts = {};
    const severityCounts = {};
    const active = [];
    for await (const line of rl) {
        if (!line.trim())
            continue;
        const item = JSON.parse(line);
        const p = (async () => {
            try {
                const report = (0, validate_1.validateLLM)(item.text ?? item, {});
                total += 1;
                sumScore += report.score;
                for (const it of report.issues) {
                    typeCounts[it.type] = (typeCounts[it.type] || 0) + 1;
                    severityCounts[it.severity] = (severityCounts[it.severity] || 0) + 1;
                }
                if (outStream) {
                    outStream.write(JSON.stringify({ id: item.id, report }) + '\n');
                }
                // collect html row (inside scope where report is defined)
                if (typeof item.id !== 'undefined') {
                    const safeText = (item.text || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const issuesHtml = report.issues.map((it) => `<div><strong>${it.type}</strong> <em>${it.severity}</em>: ${it.message}</div>`).join('');
                    htmlRows.push(`<tr><td>${item.id}</td><td>${report.score}</td><td>${safeText}</td><td>${issuesHtml}</td></tr>`);
                }
            }
            catch (err) {
                // log and continue
                console.error('Item processing error:', err);
            }
        })();
        active.push(p);
        p.finally(() => {
            const idx = active.indexOf(p);
            if (idx >= 0)
                active.splice(idx, 1);
        });
        if (active.length >= parallel) {
            // wait for any to finish
            try {
                await Promise.race(active);
            }
            catch (e) { /* ignore single task errors */ }
        }
    }
    // wait for remaining
    await Promise.all(active.map(p => p.catch(() => { })));
    if (outStream)
        outStream.end();
    const avg = total ? (sumScore / total) : 0;
    return { total, avgScore: avg, typeCounts, severityCounts, htmlRows };
}
async function main() {
    const args = parseArgs();
    if (!args.file) {
        console.error('Missing --file <path>');
        process.exit(1);
    }
    try {
        const res = await processFile(args.file, args.out, args.parallel ?? 4);
        console.log('Batch run summary:');
        console.log('Total items:', res.total);
        console.log('Average score:', res.avgScore.toFixed(2));
        console.log('Issue types:', res.typeCounts);
        console.log('Severity counts:', res.severityCounts);
        if (args.html) {
            const htmlFile = path_1.default.resolve(process.cwd(), args.html);
            const html = `<!doctype html><html><head><meta charset="utf-8"><title>VerifAI report</title><style>body{font-family:Arial,Helvetica,sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}th{background:#f2f2f2}</style></head><body><h1>VerifAI batch report</h1><p>Total: ${res.total} — Average score: ${res.avgScore.toFixed(2)}</p><table><thead><tr><th>ID</th><th>Score</th><th>Text</th><th>Issues</th></tr></thead><tbody>${res.htmlRows.join('')}</tbody></table></body></html>`;
            fs_1.default.writeFileSync(htmlFile, html, 'utf-8');
            console.log('Wrote HTML report to', htmlFile);
        }
    }
    catch (err) {
        console.error('Batch run failed:', err.message || err);
        process.exit(2);
    }
}
main();
