import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface WasmExports {
  memory: WebAssembly.Memory;
  computePointsAverage: (ptr: number) => number;
  __new: (len: number, id: number) => number;
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
}

async function init() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const wasmBuffer = readFileSync(join(__dirname, '../build/average.wasm'));

  const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
    env: {
      abort: (msg: number, file: number, line: number, column: number) => {
        console.error('Abort called from wasm');
      },
    },
  });

  const exports = wasmModule.instance.exports as unknown as WasmExports;

  // Test points as flat array [x1,y1,x2,y2,...]
  const points = [
    2.5, 1.0,  // point 1 (x,y)
    4.7, 2.5,  // point 2 (x,y)
    8.1, 3.7,  // point 3 (x,y)
    1.3, 4.2,  // point 4 (x,y)
    9.2, 5.8   // point 5 (x,y)
  ];

  // Allocate memory for the points array
  const pointsPtr = exports.__new(points.length * 8, 3); // 3 for StaticArray, 8 bytes per f64
  exports.__pin(pointsPtr);

  // Get memory as Float64Array
  const memory = new Float64Array(exports.memory.buffer);

  // Copy points to WebAssembly memory
  points.forEach((value, i) => {
    memory[pointsPtr / 8 + i] = value;
  });

  // Compute averages
  const resultPtr = exports.computePointsAverage(pointsPtr);
  exports.__pin(resultPtr);

  // Read results
  const averageX = memory[resultPtr / 8];
  const averageY = memory[resultPtr / 8 + 1];

  // Clean up
  exports.__unpin(resultPtr);
  exports.__unpin(pointsPtr);

  console.log("Points:", points);
  console.log("Points as (x,y):", points.reduce((acc, val, i) => {
    if (i % 2 === 0) {
      acc.push(`(${val}, ${points[i + 1]})`);
    }
    return acc;
  }, [] as string[]));
  console.log("Average X:", averageX.toFixed(2));
  console.log("Average Y:", averageY.toFixed(2));
}

init().catch(console.error);
