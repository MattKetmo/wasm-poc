import { SimpleParser, TransformVisitor } from "visitor-as/dist/index.js";
import { Parser } from "assemblyscript/dist/assemblyscript.js";

const entrypointFunctionText = `
export function entrypoint(): i32 {
  return score([new Point(1, 2), new Point(3, 4)]);
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
}

export default EntrypointTransformer;
