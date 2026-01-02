#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Health check script for production validation
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function checkEndpoint(path, expectedStatus = 200) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    if (response.status === expectedStatus) {
      console.log(`✅ ${path} - OK (${response.status})`);
      return true;
    } else {
      console.error(`❌ ${path} - Failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${path} - Error:`, error.message);
    return false;
  }
}

async function runHealthChecks() {
  console.log("Running health checks for:", BASE_URL);
  console.log("================================\n");

  const checks = [
    { path: "/", name: "Homepage" },
    {
      path: "/api/health",
      name: "Health endpoint",
      expectedStatus: [200, 404],
    },
    { path: "/api/magazines", name: "Magazines API" },
    { path: "/privacy", name: "Privacy page" },
    { path: "/impressum", name: "Impressum page" },
  ];

  let allPassed = true;

  for (const check of checks) {
    const expectedStatus = Array.isArray(check.expectedStatus)
      ? check.expectedStatus
      : [check.expectedStatus || 200];

    let passed = false;
    for (const status of expectedStatus) {
      if (await checkEndpoint(check.path, status)) {
        passed = true;
        break;
      }
    }

    if (!passed) {
      allPassed = false;
    }
  }

  console.log("\n================================");
  if (allPassed) {
    console.log("✅ All health checks passed!");
    process.exit(0);
  } else {
    console.log("❌ Some health checks failed!");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthChecks();
}

module.exports = { runHealthChecks, checkEndpoint };
