import { Transform } from "assemblyscript/dist/transform.js";
class EntrypointTransformer extends Transform {
    afterParse(parser) {
        const sources = parser.sources;
        for (const source of sources) {
            if (!source.text)
                continue;
            this.processSource(source, parser);
        }
    }
    processSource(source, parser) {
        const statements = source.statements;
        if (!statements)
            return;
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.kind === 55) {
                const functionDecl = statement;
                if (functionDecl.name.text === "score") {
                    console.log("found score function");
                    this.createEntrypointFunction(source, parser);
                    break;
                }
            }
        }
    }
    createEntrypointFunction(source, parser) {
        const entrypointFunctionText = `
export function entrypoint(): i32 {
  return 42;
}`;
        console.log(source);
        console.log(parser);
        const entrypointFunction = parser.parseFile(entrypointFunctionText, "entrypoint.ts", true);
    }
}
export default EntrypointTransformer;
//# sourceMappingURL=index.js.map