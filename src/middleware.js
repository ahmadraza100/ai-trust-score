const { validateLLM } = require('./core/validate');

/**
 * guardHandler(handler, options)
 * - handler: async function(req, res) that returns the model output (string or object)
 * - options: { threshold: number (0-100), validateConfig: object }
 *
 * Returns an express-compatible handler that validates the handler's output
 * and either responds with { output, report } or blocks with 422 + report.
 */
function guardHandler(handler, options = {}) {
  const threshold = options.threshold ?? 80;
  const validateConfig = options.validateConfig || {};
  return async function (req, res, next) {
    try {
      const output = await handler(req, res);
      const report = validateLLM(output, validateConfig);
      if (!report || typeof report.score !== 'number') {
        return res.status(500).json({ error: 'validator error', report });
      }
      if (report.score < threshold) {
        return res.status(422).json({ blocked: true, report });
      }
      return res.json({ output, report });
    }
    catch (err) {
      next(err);
    }
  };
}

module.exports = { guardHandler };
