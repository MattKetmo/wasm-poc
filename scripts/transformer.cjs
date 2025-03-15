// Standalone transformer for AssemblyScript
class EntrypointTransformer {
  // Called by the AssemblyScript compiler
  afterParse(parser) {
    const sources = parser.sources;

    for (const source of sources) {
      if (!source.text) continue;

      // Process each source file
      this.processSource(source, parser);
    }

    return parser;
  }

  processSource(source, parser) {
    const statements = source.statements;
    if (!statements) return;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Check if it's a function declaration
      if (statement.kind === parser.NodeKind.FUNCTIONDECLARATION) {
        // Try different approaches to find the comment
        let hasEntrypointComment = false;

        // Approach 1: Check using range property
        if (statement.range) {
          const text = source.text.substring(0, statement.range.start);
          const lines = text.split('\n');

          // Look for the special comment in the last few lines before the function
          for (let j = lines.length - 1; j >= Math.max(0, lines.length - 5); j--) {
            if (lines[j].includes('// @entrypoint')) {
              hasEntrypointComment = true;
              break;
            }
          }
        }

        // Approach 2: Check using declaration's line number
        if (!hasEntrypointComment && statement.declaration && statement.declaration.range) {
          const text = source.text.substring(0, statement.declaration.range.start);
          const lines = text.split('\n');

          for (let j = lines.length - 1; j >= Math.max(0, lines.length - 5); j--) {
            if (lines[j].includes('// @entrypoint')) {
              hasEntrypointComment = true;
              break;
            }
          }
        }

        // Approach 3: Check the entire source for the pattern
        if (!hasEntrypointComment) {
          const sourceLines = source.text.split('\n');
          for (let j = 0; j < sourceLines.length - 1; j++) {
            if (sourceLines[j].includes('// @entrypoint') &&
                sourceLines[j+1].includes(`export function ${statement.name.text}`)) {
              hasEntrypointComment = true;
              break;
            }
          }
        }

        if (hasEntrypointComment) {
          // Create a new entrypoint function
          this.createEntrypointFunction(source, statement, parser);
        }
      }
    }
  }

  createEntrypointFunction(source, originalFunction, parser) {
    // Get the function name
    const functionName = originalFunction.name.text;

    // Create a new function named 'entrypoint'
    const entrypointFunctionText = `
export function entrypoint(): i32 {
  const point = new Point(3, 6);
  return ${functionName}(point);
}`;

    // Parse the new function
    const entrypointFunction = parser.parseFile(
      entrypointFunctionText,
      "entrypoint.ts",
      true
    );

    // Add the new function to the source
    if (entrypointFunction && entrypointFunction.statements.length > 0) {
      source.statements.push(entrypointFunction.statements[0]);
    }
  }
}

// Export a factory function that creates a new transformer instance
module.exports = function() {
  return new EntrypointTransformer();
};
