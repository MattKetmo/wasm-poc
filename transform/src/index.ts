import { Transform } from "assemblyscript/dist/transform.js";
import {
  ClassDeclaration,
  FieldDeclaration,
  IdentifierExpression,
  Parser,
  Source,
  NodeKind,
  FunctionDeclaration,
  CommonFlags,
  ImportStatement,
  Node,
  Tokenizer,
  SourceKind,
  NamedTypeNode,
  Range,
  FEATURE_SIMD,
  FunctionExpression,
  MethodDeclaration,
  Statement,
} from "assemblyscript/dist/assemblyscript.js";

class EntrypointTransformer extends Transform {
  afterParse(parser: Parser) {
    const sources = parser.sources;

    for (const source of sources) {
      if (!source.text) continue;

      // Process each source file
      this.processSource(source, parser);
    }

    // return super.afterParse(parser);
  }

  processSource(source: Source, parser: Parser): void {
    const statements = source.statements;
    if (!statements) return;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Check if it's a function declaration
      if (statement.kind === NodeKind.FunctionDeclaration) {
        const functionDecl = statement as FunctionDeclaration;
        // Check if the function name is 'score'
        if (functionDecl.name.text === "score") {
          console.log("found score function")
          // Create a new entrypoint function
          this.createEntrypointFunction(source, parser);
          break;
        }
      }
    }
  }

  createEntrypointFunction(source: Source, parser: Parser): void {
    // Create a new function named 'entrypoint'
//     const entrypointFunctionText = `
// export function entrypoint(): i32 {
//   const point = new Point(3, 6);
//   return score(point);
// }`;
    const entrypointFunctionText = `
export function entrypoint(): i32 {
  return 42;
}`;
console.log(source)
console.log(parser)

    // Parse the new function
    const entrypointFunction = parser.parseFile(
      entrypointFunctionText,
      "entrypoint.ts",
      true
    );

    // Add the new function to the source
    // const parsedSource = parser.sources[parser.sources.length - 1];
    // if (parsedSource && parsedSource.statements && parsedSource.statements.length > 0) {
    //   source.statements.push(parsedSource.statements[0]);
    // }
  }
}

export default EntrypointTransformer;
