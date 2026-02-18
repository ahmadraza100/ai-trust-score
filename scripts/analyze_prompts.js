#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');
const { validateLLM } = require('../src/core/validate.js');

function usage() {
  console.error('Usage: node scripts/analyze_prompts.js <prompts-file> [--out out.json|out.csv] [--format json|csv] [--config config.json]');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

let inputPath = argv[0];
let outPath = null;
let format = 'csv';
let config = { verbose: false };

for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out' && argv[i + 1]) {
    outPath = argv[i + 1];
    i++;
  }
  else if (a === '--format' && argv[i + 1]) {
    format = argv[i + 1];
    i++;
  }
  else if (a === '--json') {
    format = 'json';
  }
  else if (a === '--config' && argv[i + 1]) {
    try {
      const cfgRaw = fs.readFileSync(path.resolve(process.cwd(), argv[i + 1]), 'utf-8');
      config = JSON.parse(cfgRaw);
    }
    catch (e) {
      console.error('Failed to read config file:', argv[i + 1], e.message);
      process.exit(2);
    }
    i++;
  }
}

if (!fs.existsSync(inputPath)) {
  const p = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(p)) {
    console.error('prompts file not found:', inputPath);
    process.exit(2);
  }
  inputPath = p;
}

const raw = fs.readFileSync(inputPath, 'utf-8');
let prompts = [];
try {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    prompts = parsed;
  }
  else if (typeof parsed === 'string') {
    prompts = parsed.split(/\r?\n/).filter(Boolean);
  }
  else {
    prompts = [parsed];
  }
}
catch (e) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  prompts = lines.map(l => {
    try { return JSON.parse(l); } catch (e) { return l; }
  });
}

const results = [];
for (let i = 0; i < prompts.length; i++) {
  const input = prompts[i];
  try {
    const report = validateLLM(input, config || { verbose: false });
    results.push({ index: i, input, score: report.score, ok: report.ok, issues: report.issues });
  }
  catch (e) {
    results.push({ index: i, input, error: String(e) });
  }
}

if (!outPath || format === 'json') {
  const out = format === 'json' ? JSON.stringify(results, null, 2) : JSON.stringify(results);
  if (outPath) fs.writeFileSync(outPath, out, 'utf-8');
  else console.log(out);
  process.exit(0);
}

const safe = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
  try { return `"${JSON.stringify(v).replace(/"/g, '""')}"`; } catch (e) { return '""'; }
}

const rows = [];
rows.push(['index', 'score', 'ok', 'issues_count', 'input_preview'].join(','));
for (const r of results) {
  const preview = typeof r.input === 'string' ? r.input.slice(0, 200) : JSON.stringify(r.input).slice(0, 200);
  rows.push([r.index, r.score ?? '', r.ok ?? '', (r.issues && r.issues.length) || 0, preview.replace(/\n/g, ' ')].map(safe).join(','));
}
const csv = rows.join('\n');
if (outPath) fs.writeFileSync(outPath, csv, 'utf-8');
else console.log(csv);
