import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'reports');
const inputJsonPath = path.join(reportsDir, 'api-jest-results.json');
const outputMarkdownPath = path.join(reportsDir, 'api-test-report.md');

function toEndpointFromTitle(fullTitle) {
  const match = fullTitle.match(
    /\[(GET|POST|PATCH|DELETE|PUT|OPTIONS|HEAD)\s+([^\]]+)\]/,
  );
  if (!match) {
    return 'Unclassified';
  }

  const method = match[1];
  const route = match[2];
  return `${method} ${route}`;
}

function toCaseLabel(fullTitle) {
  const noPrefix = fullTitle.replace(/^.*?\]\s*/, '');
  return noPrefix || fullTitle;
}

function classifyCase(fullTitle) {
  const text = fullTitle.toLowerCase();
  if (
    text.includes('reject') ||
    text.includes('invalid') ||
    text.includes('not found') ||
    text.includes('forbidden') ||
    text.includes('without token')
  ) {
    return 'edge';
  }

  if (
    text.includes('deactivated') ||
    text.includes('malformed') ||
    text.includes('missing') ||
    text.includes('unknown')
  ) {
    return 'edge';
  }

  return 'core';
}

function formatFailureMessage(message) {
  if (!message) {
    return 'No failure message provided.';
  }

  const firstLine = message.split('\n').find((line) => line.trim().length > 0);
  return (firstLine ?? message).trim();
}

function summarizeSuite(results) {
  const allTests = [];

  for (const suite of results.testResults ?? []) {
    for (const assertion of suite.assertionResults ?? []) {
      const fullTitle = assertion.fullName || assertion.title || 'Unnamed test';
      const endpoint = toEndpointFromTitle(fullTitle);

      allTests.push({
        suiteName: suite.name,
        fullTitle,
        endpoint,
        caseLabel: toCaseLabel(fullTitle),
        caseType: classifyCase(fullTitle),
        status: assertion.status,
        duration: assertion.duration ?? null,
        failureMessages: assertion.failureMessages ?? [],
      });
    }
  }

  const endpointMap = new Map();
  for (const test of allTests) {
    if (!endpointMap.has(test.endpoint)) {
      endpointMap.set(test.endpoint, {
        endpoint: test.endpoint,
        total: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        edgeTotal: 0,
        edgePassed: 0,
        edgeFailed: 0,
      });
    }

    const bucket = endpointMap.get(test.endpoint);
    bucket.total += 1;

    if (test.caseType === 'edge') {
      bucket.edgeTotal += 1;
    }

    if (test.status === 'passed') {
      bucket.passed += 1;
      if (test.caseType === 'edge') {
        bucket.edgePassed += 1;
      }
    } else if (test.status === 'failed') {
      bucket.failed += 1;
      if (test.caseType === 'edge') {
        bucket.edgeFailed += 1;
      }
    } else {
      bucket.pending += 1;
    }
  }

  const endpoints = Array.from(endpointMap.values()).sort((a, b) => {
    if (a.endpoint === 'Unclassified') return 1;
    if (b.endpoint === 'Unclassified') return -1;
    return a.endpoint.localeCompare(b.endpoint);
  });

  const failedTests = allTests.filter((test) => test.status === 'failed');
  const edgeTests = allTests.filter((test) => test.caseType === 'edge');
  const edgePassed = edgeTests.filter((test) => test.status === 'passed').length;
  const edgeFailed = edgeTests.filter((test) => test.status === 'failed').length;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      totalSuites: results.numTotalTestSuites ?? 0,
      passedSuites: results.numPassedTestSuites ?? 0,
      failedSuites: results.numFailedTestSuites ?? 0,
      pendingSuites: results.numPendingTestSuites ?? 0,
      totalTests: results.numTotalTests ?? allTests.length,
      passedTests: results.numPassedTests ?? 0,
      failedTests: results.numFailedTests ?? 0,
      pendingTests: results.numPendingTests ?? 0,
      durationMs:
        results.testResults?.reduce(
          (acc, suite) => acc + (suite.endTime - suite.startTime),
          0,
        ) ?? null,
    },
    edgeCases: {
      total: edgeTests.length,
      passed: edgePassed,
      failed: edgeFailed,
    },
    endpoints,
    failedTests: failedTests.map((test) => ({
      endpoint: test.endpoint,
      caseLabel: test.caseLabel,
      failure: formatFailureMessage(test.failureMessages[0]),
    })),
  };
}

function formatMarkdown(summary) {
  const lines = [];

  lines.push('# API Black-Box Test Report');
  lines.push('');
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push('');
  lines.push('## Overall Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | ---: |');
  lines.push(
    `| Test suites (passed/total) | ${summary.totals.passedSuites}/${summary.totals.totalSuites} |`,
  );
  lines.push(
    `| Tests (passed/failed/pending/total) | ${summary.totals.passedTests}/${summary.totals.failedTests}/${summary.totals.pendingTests}/${summary.totals.totalTests} |`,
  );
  lines.push(
    `| Edge cases (passed/failed/total) | ${summary.edgeCases.passed}/${summary.edgeCases.failed}/${summary.edgeCases.total} |`,
  );

  if (summary.totals.durationMs !== null) {
    lines.push(`| Duration (ms) | ${summary.totals.durationMs} |`);
  }

  lines.push('');
  lines.push('## Endpoint Results');
  lines.push('');
  lines.push(
    '| Endpoint | Passed | Failed | Pending | Total | Edge Passed | Edge Failed | Edge Total |',
  );
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');

  for (const endpoint of summary.endpoints) {
    lines.push(
      `| ${endpoint.endpoint} | ${endpoint.passed} | ${endpoint.failed} | ${endpoint.pending} | ${endpoint.total} | ${endpoint.edgePassed} | ${endpoint.edgeFailed} | ${endpoint.edgeTotal} |`,
    );
  }

  lines.push('');
  lines.push('## Failed Cases');
  lines.push('');

  if (summary.failedTests.length === 0) {
    lines.push('All test cases passed.');
  } else {
    lines.push('| Endpoint | Case | Failure |');
    lines.push('| --- | --- | --- |');
    for (const failed of summary.failedTests) {
      lines.push(
        `| ${failed.endpoint} | ${failed.caseLabel} | ${failed.failure.replace(/\|/g, '\\|')} |`,
      );
    }
  }

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const raw = await fs.readFile(inputJsonPath, 'utf8');
  const results = JSON.parse(raw);
  const summary = summarizeSuite(results);
  const markdown = formatMarkdown(summary);

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(outputMarkdownPath, markdown, 'utf8');

  process.stdout.write(
    `Wrote Markdown report to ${path.relative(projectRoot, outputMarkdownPath)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `Failed to generate API report: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
