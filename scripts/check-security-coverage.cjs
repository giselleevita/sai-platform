#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[security-coverage] ${message}`);
  process.exit(1);
}

const [summaryPathArg, fileKey, statementsMinArg, branchesMinArg, functionsMinArg, linesMinArg] =
  process.argv.slice(2);

if (!summaryPathArg || !fileKey) {
  fail(
    'Usage: node scripts/check-security-coverage.cjs <coverage-summary.json> <fileKey> <statementsMin> <branchesMin> <functionsMin> <linesMin>'
  );
}

const summaryPath = path.resolve(process.cwd(), summaryPathArg);

if (!fs.existsSync(summaryPath)) {
  fail(`Coverage summary not found: ${summaryPath}`);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const explicitMatch = summary[fileKey] || summary[`./${fileKey}`];
const suffixMatchKey = Object.keys(summary).find((key) => key.endsWith(fileKey));
const fileCoverage = explicitMatch || (suffixMatchKey ? summary[suffixMatchKey] : undefined);

if (!fileCoverage) {
  fail(`Coverage entry missing for "${fileKey}" in ${summaryPath}`);
}

const thresholds = {
  statements: Number(statementsMinArg || 0),
  branches: Number(branchesMinArg || 0),
  functions: Number(functionsMinArg || 0),
  lines: Number(linesMinArg || 0),
};

const actual = {
  statements: fileCoverage.statements?.pct ?? 0,
  branches: fileCoverage.branches?.pct ?? 0,
  functions: fileCoverage.functions?.pct ?? 0,
  lines: fileCoverage.lines?.pct ?? 0,
};

const failed = Object.entries(thresholds).filter(([metric, minimum]) => actual[metric] < minimum);

if (failed.length > 0) {
  const detail = failed
    .map(([metric, minimum]) => `${metric}: ${actual[metric]}% < ${minimum}%`)
    .join(', ');
  fail(`Coverage threshold failed for ${fileKey}: ${detail}`);
}

console.log(
  `[security-coverage] Passed for ${fileKey}: statements ${actual.statements}%, branches ${actual.branches}%, functions ${actual.functions}%, lines ${actual.lines}%`
);
