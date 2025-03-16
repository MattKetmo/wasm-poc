import { SimpleParser, TransformVisitor } from "visitor-as/dist/index.js";
import {
  Expression,
  CallExpression,
  IdentifierExpression,
  Parser,
  Source,
  NodeKind,
  FunctionDeclaration,
} from "assemblyscript/dist/assemblyscript.js";

const entrypointFunctionText = `
export function entrypoint(): i32 {
  return score(new Point(3, 4));
}
`;

class EntrypointTransformer extends TransformVisitor {
  afterParse(parser: Parser): void {
    const sources = parser.sources;

    sources.forEach((source) => {
      if (!source.text) return;

      if (source.simplePath === "module") {
        const entrypointFunction = SimpleParser.parseTopLevelStatement(
          entrypointFunctionText
        );
        source.statements.push(entrypointFunction);
      }

      this.visit(source);
    });
  }

  override visitFunctionDeclaration(
    node: FunctionDeclaration,
    isDefault = false
  ): FunctionDeclaration {
    // const name = node.name.text;
    // if (name !== "score") {
    //   return super.visitFunctionDeclaration(node, isDefault);
    // }
    return super.visitFunctionDeclaration(node, isDefault);

    console.log("visitFunctionDeclaration", node.name.text);

    // Create an entrypoint function that calls score with a new Point(1,2)
    const entrypointFunctionText = `
export function entrypoint(): i32 {
  // return score(new Point(1, 2));
  return 42;
}`;

    // Parse the entrypoint function text into an AST node
    const entrypointFunction = SimpleParser.parseStatement(
      entrypointFunctionText
    );

    // Add the entrypoint function to the source file
    if (node.range && node.range.source && node.range.source.statements) {
      node.range.source.statements.push(entrypointFunction);
    }

    return super.visitFunctionDeclaration(node, isDefault);
  }
}

export default EntrypointTransformer;
