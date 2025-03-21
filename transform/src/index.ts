import { Parser, Tokenizer, Source, SourceKind } from "assemblyscript/dist/assemblyscript.js";
import { Transform } from "assemblyscript/dist/transform.js";

export default class InjectEntrypointTransform extends Transform {
  afterParse(parser: Parser): void {
    const sources = parser.sources;

    for (const source of sources) {
      if (source.simplePath === "module") {

        const functionToInject = `
export function entrypoint(): i32 {
  const points = [new Point(1, 2), new Point(3, 4)];
  return score(points);
}`;

        const injectSource = new Source(
          SourceKind.User, // sourceKind (USER for user-provided code)
          "inject.ts",     // normalizedPath
          functionToInject // text content
        );

        const tokenizer = new Tokenizer(injectSource);
        const injectedStatements = parser.parseTopLevelStatement(tokenizer)
        source.statements.push(injectedStatements);

        console.log(`Injected 'entrypoint' function into '${source.simplePath}'`);
      }
    }
  }
}
