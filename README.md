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

## License

See the `LICENSE` file in this repository.

Made with love by ahmadraza100
