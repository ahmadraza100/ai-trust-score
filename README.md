# ai-trust-score — developer summary

ai-trust-score performs deterministic checks on model outputs to help teams gate, audit, and monitor LLM-generated text and structured responses. The repository is source-first: the package exposes `src/` as the module entry and does not commit build artifacts.

## Install

```bash
npm install ai-trust-score
```

## Exports and what they do

- validateLLM(input, config?)
  - input: string | object. Runs enabled detectors over the provided model output and returns a compact report with fields `ok` (boolean), `score` (0–100), and `issues` (array).
  - config options: `detectors` (object to enable/disable), `verbose` (boolean to include `summary`, `meta`, and `config`), and detector-specific options.

- guardHandler(handler, options)
  - Accepts an async handler that returns model output. Runs validation on the handler's output and maps the result to HTTP responses: success yields 200 with `{ output, report }`; blocked yields 422 with `{ blocked: true, report }`.
  - Options include `threshold` (score threshold for blocking) and `validateConfig` (overrides for validateLLM).

- types
  - Re-exported TypeScript type definitions for the public API and detector shapes.

## Core config fields

- `detectors`: enable or disable detectors by name, for example `{ numeric: true, hallucination: true }`.
- `verbose`: when true the report includes `summary`, `meta` (timestamp, inputType, packageVersion, detectors), and `config`.
- `threshold`: numeric threshold used by `guardHandler` to decide whether to block outputs.

## Built-in detectors

- `numeric` — basic numeric consistency checks (simple arithmetic and percent sanity checks).
- `hallucination` — pattern-based heuristics that flag likely hallucinated facts.
- `inconsistency` — detects internal contradictions in a single output.
- `overconfidence` — flags overly certain language when claims are uncertain.

## Issue object layout

- `type`: detector name (string)
- `severity`: `low | medium | high`
- `message`: short human-friendly description
- `meta`: optional detector-specific evidence object

## Examples

CommonJS

```js
const { validateLLM } = require('ai-trust-score');
const report = validateLLM('The capital of France is Berlin.', { detectors: { hallucination: true } });
console.log(report);
```

ESM / TypeScript

```ts
import validateLLM from 'ai-trust-score';
const report = validateLLM('Revenue grew 20% from 100 to 150', { detectors: { numeric: true }, verbose: true });
console.log(report.summary);
```

Express minimal handler

```js
const express = require('express');
const { guardHandler } = require('ai-trust-score');
const app = express();
app.use(express.json());

app.post('/generate', guardHandler(async (req) => {
  // return model output (string or object)
  return await myLLM.generate(req.body.prompt);
}, { threshold: 80 }));

app.listen(3001);
```

## Sample verbose report

```json
{
  "ok": false,
  "score": 92,
  "issues": [
    { "type": "numeric", "severity": "medium", "message": "Percent change inconsistent: 100 -> 150 is 50% not 20%", "meta": { "expected": "50%", "actual": "20%" } }
  ],
  "summary": "Detected 1 issue(s). Trust score 92/100.",
  "meta": { "timestamp": "2026-02-18T00:48:32.716Z", "inputType": "string", "packageVersion": "1.0.1", "detectors": ["numeric","hallucination"] },
  "config": { "detectors": { "numeric": true }, "verbose": true }
}
```

## Run CLI/demo locally (source-first)

```bash
# run CLI (uses src/)
npm run cli

# run demo script
npm run demo
```

## Notes and tips

- The project is intentionally source-first. If you prefer built artifacts, set `prepare` to run the build and point `main`/`bin` at `dist/`.
- Use `verbose: true` for debugging detector evidence.

## Custom rules and tuning

You can extend and tune the built-in detectors without changing code by supplying custom pattern rules or editing the included `patterns.json` file. This makes the library easy to adapt to your domain (add known institutions, project-specific phrases, or tune severities).

1) Built-in patterns file

- The repository ships `src/detectors/patterns.json`. Detectors that support configurable rules will load patterns from this file automatically. Entries are simple objects with `pattern`, optional `flags`, `message`, `severity` and `type`.

Example snippet (`src/detectors/patterns.json`):

```json
{
  "hallucination": [
    { "pattern": "\\b(My Fake Institute|Imaginary Lab)\\b", "flags": "i", "message": "Suspicious institution", "severity": "low" }
  ],
  "bias": [
    { "pattern": "\\b(obviously|no doubt)\\b", "flags": "i", "message": "Loaded language", "severity": "low" }
  ]
}
```

2) Per-run customRules via config

You can pass a `customRules` object to `validateLLM` (or to the CLI via `--config`) to override or augment rules at runtime. This is useful for temporary experiments, CI checks, or environment-specific policies.

Example `myrules.json`:

```json
{
  "customRules": {
    "hallucination": [
      { "pattern": "\\b(Example Institute|Acme Research)\\b", "flags": "i", "message": "Domain-specific suspicious org", "severity": "low" }
    ],
    "bias": [
      { "pattern": "\\b(they are criminals)\\b", "flags": "i", "message": "Dehumanizing phrase", "severity": "medium" }
    ]
  }
}
```

Pass it programmatically:

```js
const { validateLLM } = require('ai-trust-score')
const config = require('./myrules.json')
const report = validateLLM(outputText, { verbose: true, customRules: config.customRules })
```

Or with the analyzer CLI (convenience):

```bash
node ./scripts/analyze_prompts.js prompts.json --config myrules.json --out report.json --format json
```

3) Rule precedence and best practices

- Detectors first consult `config.customRules[...]` (if provided), then fall back to the repository-level `patterns.json` rules, then to built-in heuristics. That means `customRules` can override or add rules per run without touching source.
- Keep patterns conservative to avoid false positives. Start with `severity: low` and increase if you need stronger signals.
- Use case-insensitive (`i`) flags for most human-readable patterns. Avoid overly broad regexes that match common words.
- For fuzzy or typo-friendly matching, detectors use token-based fuzzy helpers where supported. When adding multi-word patterns consider including expected variants.

4) Tuning scoring

- The overall trust `score` is computed by subtracting penalties per `severity` (configurable in code). If you need different weights, consider modifying `src/core/score.js` or opening a PR to make severity weights configurable via `validateLLM` options.

If you'd like, I can:
- Add a sample `myrules.example.json` to the repo with common useful entries for hallucination, bias, and overconfidence.
- Add a small `scripts/summary_report.js` that prints aggregated metrics (avg score, counts by detector) from `report.json`.


## License

See the `LICENSE` file in this repository.

Made with love by ahmadraza100
