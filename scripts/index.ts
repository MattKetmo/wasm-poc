import fs from "fs";
import * as loader from "@assemblyscript/loader";

interface Module1Exports extends Record<string, unknown> {
  entrypoint: () => number;
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
    },
  };

  const mod = await loader.instantiate<Module1Exports>(
    fs.readFileSync("./build/module1.wasm"),
    {
      ...imports,
    }
  );

  __getString = mod.exports.__getString;

  const result = mod.exports.entrypoint();

  console.log("Result:", result);
}

main().catch(console.error);
