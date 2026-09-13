/**
 * BuggyBooks Unified k6 Summary Handler
 *
 * Standardizes summary export across all k6 performance suites.
 * Outputs machine-readable JSON summaries and self-contained interactive HTML dashboards.
 */

const { generateHtmlReport } = require('./html-reporter.js');

/**
 * Creates a configured k6 handleSummary function.
 *
 * @param {Object} options
 * @param {string} options.jsonFilename - e.g. 'perf-summary-smoke.json'
 * @param {string} [options.htmlFilename] - e.g. 'report-smoke.html'
 * @param {string} [options.title] - Human-readable benchmark title
 * @param {Object} [options.baselineData] - Optional baseline object
 * @param {boolean} [options.isRegressionSimulated]
 * @param {Function|string} [options.customStdout] - Custom stdout summary text or generator
 * @returns {Function} handleSummary(data) implementation for k6
 */
function createSummaryHandler(options = {}) {
  return function handleSummary(data) {
    const jsonFilename = options.jsonFilename || 'perf-summary.json';
    let htmlFilename = options.htmlFilename || 'report.html';
    if (htmlFilename.startsWith('performance/')) {
      htmlFilename = htmlFilename.replace('performance/', '');
    }
    const title = options.title || 'BuggyBooks Performance Benchmark';

    const htmlContent = generateHtmlReport(data, {
      title,
      baselineData: options.baselineData || null,
      isRegressionSimulated: !!options.isRegressionSimulated,
    });

    const result = {};
    result[jsonFilename] = JSON.stringify(data, null, 2);
    result[htmlFilename] = htmlContent;
    result['report.html'] = htmlContent;

    if (options.customStdout) {
      result['stdout'] = typeof options.customStdout === 'function'
        ? options.customStdout(data)
        : options.customStdout;
    }

    return result;
  };
}

module.exports = {
  createSummaryHandler,
};
