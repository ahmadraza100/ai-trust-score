# VerifAI — deterministic, local validator for LLM outputs

VerifAI helps teams detect and block common, deterministic problems in model-generated text and structured outputs. It's designed to run locally (no external APIs), in CI pipelines, or inside backend services that produce or relay LLM responses. The goal is to give you small, auditable reports that help automate gating, auditing, and monitoring of LLM outputs.

This README is intentionally comprehensive: quickstart, programmatic examples (CommonJS and ESM), how to apply VerifAI to API responses, CLI/batch usage, an illustrative report, configuration options, recommended policies, and contribution notes.

Why VerifAI

- Deterministic and auditable — no external black-box calls.
- Low operational cost — runs on your infrastructure.
- Extensible — add domain-specific JSON rule packs or custom detectors.

What VerifAI checks (examples)

- Schema validation: verify JSON outputs conform to your schema.
- Numeric consistency: flag mismatched percentages, impossible arithmetic, or inconsistent ranges.
- Hallucination heuristics: detect claims that appear fabricated or unverifiable.
- Overconfidence: detect absolute or sweeping claims presented without evidence.
- Simple contradiction checks: find sentence-level contradictions within one output.

Quick install

```bash
npm install verifai
# or
yarn add verifai
```

Programmatic usage — CommonJS (server-side)

```js
// Import the validator and run it on a single string output
const { validateLLM } = require('verifai');

const text = 'The product revenue grew 20% from 100 to 150.';
const report = validateLLM(text, {
  detectors: { numericConsistency: true, overconfidence: true, hallucination: true },
  // customRules: { /* optional domain-specific rules */ }
});

console.log(report.score);   // 0..100
console.log(report.issues);  // array of issues
```

Programmatic usage — ESM / TypeScript

```ts
import { validateLLM } from 'verifai';

const report = validateLLM('The capital of France is Berlin.', { detectors: { hallucination: true } });
console.log(report);
```

Applying VerifAI to API responses (recommended patterns)

Inline validation (explicit)

```js
const modelOutput = await myLLM.generate(prompt);
const report = validateLLM(modelOutput);
if (report.score < 75) {
  // return a safe fallback, request regeneration, or present a human review flag
}
```

Middleware pattern (convenience)

```js
import express from 'express';
import { llmGuardMiddleware } from 'verifai';

const app = express();
app.use(express.json());

app.post('/generate', llmGuardMiddleware({ threshold: 80 }), (req, res) => {
  const { allowed, report, output } = res.locals;
  if (!allowed) return res.status(422).json({ error: 'Blocked by VerifAI', report });
  res.json({ reply: output, report });
});
```

Policy notes

- Thresholds are organizational: 80 is a sensible starting point. Use higher thresholds in high-risk domains.
- Instead of outright blocking, consider fallback behaviors: regenerate, lower-risk response, or human review.

CLI & batch usage

The package exposes a small CLI for ad-hoc checks and a batch mode for audits. Use the published package via `npx verifai` or install it locally.

```bash
# Human-friendly table
npx verifai check --file path/to/output.txt

# Machine-readable JSON
npx verifai check --file path/to/output.txt --json

# Batch audit (JSONL -> results + HTML summary)
npx verifai batch --file samples.jsonl --out results.jsonl --parallel 8 --html report.html
```

Illustration — sample GuardReport

Calling `validateLLM(text, config)` returns a `GuardReport` object. Example:

```json
{
  "score": 92,
  "issues": [
    {
      "detector": "numeric-consistency",
      "severity": "medium",
      "message": "20% inconsistent with increase from 100 to 150 (~50%).",
      "meta": { "found": "20%", "expectedApprox": "50%", "evidence": "increase from 100 to 150" }
    }
  ],
  "summary": "Detected 1 issue(s). Trust score 92/100."
}
```

Fields explained

- `score`: integer 0–100. Starts at 100 and subtracts penalties according to issue severities.
- `issues`: array of objects { detector, severity, message, meta }.
- `summary`: short, human-friendly summary.

Configuration and extension points

- `GuardConfig` (second parameter to `validateLLM`) accepts:
  - `detectors`: enable/disable detector groups (e.g., `numericConsistency`, `hallucination`).
  - `customRules`: JSON rule packs to add or override existing patterns.
  - `threshold`: an app-level policy useful for middleware.

Custom rules example

```js
const custom = {
  hallucination: [
    { id: 'hall-001', pattern: "\\bthe capital of mars\\b", severity: 'high', message: 'Fictional location' }
  ]
};
const r = validateLLM('The capital of Mars is Olympus City.', { customRules: custom });
```

Best practices & edge cases

- Empty or null outputs: treat as a special case (many policies opt to block or re-generate).
- Very large outputs: validate in slices or in a background worker to avoid blocking request threads.
- Streaming responses: validate on completion or validate stable substrings as they arrive.
- Always persist `GuardReport`s for auditing and trending.

Contributing and maintenance

- To add detectors or curated rule packs (finance, healthcare), open an issue or PR and include unit tests and rule pack JSON.
- For maintainability, keep a development branch with TypeScript sources and tests if you plan to iterate detectors frequently.

Publishing & verification

- Verify the tarball contents with:

```bash
npm pack --dry-run
```

- Double-check `package.json` metadata (name, author, repository) before `npm publish`.

License, support, and ethos

- License: see `LICENSE`.
- Made with ❤️ by ahmadraza100. Open to expand — if you need help with curated rule packs or secure deployment, open an issue or reach out via the repository.
