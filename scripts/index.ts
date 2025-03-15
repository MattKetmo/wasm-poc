import fs from "fs";
import * as loader from "@assemblyscript/loader";

interface Module1Exports extends Record<string, unknown> {
  memory: WebAssembly.Memory;
  entrypoint: () => number;
}

interface Module2Exports extends Record<string, unknown> {
  implement: (foobar: string) => number;
}

async function main() {
  let __getString: any;
  const imports = {
    env: {
      abort: (_msg: number, _file: number, line: number, column: number) => {
        console.error(`Abort at ${line}:${column}`);
      },
      "console.log": (msg: number) => {
        console.log(`${(msg && __getString(msg)) || msg}`);
      },
      memory: new WebAssembly.Memory({
        // shared: true,
        initial: 100,
        maximum: 10000,
      }),
    },
  };

  const mod2 = await loader.instantiate<Module2Exports>(
    fs.readFileSync("./build/module2.wasm"),
    {
      ...imports,
    }
  );

  const mod1 = await loader.instantiate<Module1Exports>(
    fs.readFileSync("./build/module1.wasm"),
    {
      ...imports,
      module1: {
        implement: mod2.exports.implement,
      },
    }
  );

  __getString = mod2.exports.__getString;

  const result = mod1.exports.entrypoint();

  console.log("Result:", result);
}

main().catch(console.error);
