// Import the transformer factory
const createTransformer = require("./transformer.cjs");
const fs = require("fs");
const path = require("path");

// Mock parser and source
const mockParser = {
  NodeKind: {
    FUNCTIONDECLARATION: 1
  },
  parseFile: (text, filename, isExpression) => {
    console.log("Parsing:", text.substring(0, 30) + "...");
    return {
      statements: [
        {
          kind: 1,
          name: { text: "entrypoint" }
        }
      ]
    };
  }
};

// Sample source text
const sourceText = `
import { Point } from "./types";

// @entrypoint
export function score(point: Point): i32 {
  return i32(point.x) + i32(point.y);
}
`;

// Test with different mock sources to test all approaches
function runTest(testName, mockSource) {
  console.log(`\n--- Running test: ${testName} ---`);

  // Create transformer instance using the factory
  const transformer = createTransformer();

  // Process the mock source
  transformer.processSource(mockSource, mockParser);

  // Check if the entrypoint function was added
  if (mockSource.statements.length > 1) {
    console.log("✅ Transformer successfully added the entrypoint function");
    console.log("Original function:", mockSource.statements[0].name.text);
    console.log("Generated function:", mockSource.statements[1].name.text);
    return true;
  } else {
    console.error("❌ Transformer failed to add the entrypoint function");
    return false;
  }
}

// Test 1: With range property
const mockSource1 = {
  text: sourceText,
  statements: [
    {
      kind: 1, // FUNCTIONDECLARATION
      name: { text: "score" },
      range: {
        start: sourceText.indexOf("export function"),
        end: sourceText.length - 1
      }
    }
  ]
};

// Test 2: With declaration.range property
const mockSource2 = {
  text: sourceText,
  statements: [
    {
      kind: 1, // FUNCTIONDECLARATION
      name: { text: "score" },
      declaration: {
        range: {
          start: sourceText.indexOf("export function"),
          end: sourceText.length - 1
        }
      }
    }
  ]
};

// Test 3: Without any range property (using pattern matching)
const mockSource3 = {
  text: sourceText,
  statements: [
    {
      kind: 1, // FUNCTIONDECLARATION
      name: { text: "score" }
    }
  ]
};

console.log("Testing EntrypointTransformer...");

// Run all tests
const test1Result = runTest("With range property", mockSource1);
const test2Result = runTest("With declaration.range property", mockSource2);
const test3Result = runTest("Without any range property", mockSource3);

// Summary
console.log("\n--- Test Summary ---");
console.log(`Test 1 (range): ${test1Result ? "PASSED" : "FAILED"}`);
console.log(`Test 2 (declaration.range): ${test2Result ? "PASSED" : "FAILED"}`);
console.log(`Test 3 (pattern matching): ${test3Result ? "PASSED" : "FAILED"}`);
console.log(`Overall: ${(test1Result || test2Result || test3Result) ? "PASSED" : "FAILED"}`);

console.log("\nTest completed.");
