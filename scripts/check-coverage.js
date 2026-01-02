#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Check if test coverage meets the threshold
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const THRESHOLD = parseInt(process.env.COVERAGE_THRESHOLD || "80", 10);

try {
  // Read coverage summary
  const coveragePath = path.join(
    process.cwd(),
    "coverage",
    "coverage-summary.json",
  );

  if (!fs.existsSync(coveragePath)) {
    console.error("❌ Coverage file not found. Run tests with coverage first.");
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));

  // Get total coverage metrics
  const total = coverage.total;
  const metrics = {
    lines: total.lines.pct,
    statements: total.statements.pct,
    functions: total.functions.pct,
    branches: total.branches.pct,
  };

  console.log("Coverage Report:");
  console.log("================");

  let failed = false;

  for (const [metric, value] of Object.entries(metrics)) {
    const icon = value >= THRESHOLD ? "✅" : "❌";
    console.log(`${icon} ${metric.padEnd(12)}: ${value.toFixed(2)}%`);

    if (value < THRESHOLD) {
      failed = true;
    }
  }

  console.log("================");
  console.log(`Threshold: ${THRESHOLD}%`);

  if (failed) {
    console.log(`\n❌ Coverage is below ${THRESHOLD}% threshold`);
    process.exit(1);
  } else {
    console.log(`\n✅ Coverage meets ${THRESHOLD}% threshold`);
    process.exit(0);
  }
} catch (error) {
  console.error("❌ Error checking coverage:", error.message);
  process.exit(1);
}
