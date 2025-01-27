import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface WasmExports {
  memory: WebAssembly.Memory;
  computePointsAverage: (ptr: number, len: number) => number;
  setPoint: (arrayPtr: number, index: number, x: number, y: number) => void;
  getPoint: (arrayPtr: number, index: number) => void;
  __new: (len: number, id: number) => number;
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
}

interface Point {
  x: number;
  y: number;
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

  // Test points
  const points: Point[] = [
    { x: 2.5, y: 1.0 },
    { x: 4.7, y: 2.5 },
    { x: 8.1, y: 3.7 },
    { x: 1.3, y: 4.2 },
    { x: 9.2, y: 5.8 }
  ];

  // Allocate memory for the points array
  // Size is number of points * size of Point (16 bytes: 8 for x + 8 for y)
  const pointsPtr = exports.__new(points.length * 16, 3); // 3 for StaticArray
  exports.__pin(pointsPtr);

  // Use the helper function to set points in memory
  points.forEach((point, i) => {
    exports.setPoint(pointsPtr, i, point.x, point.y);
  });

  // Compute averages
  const resultPtr = exports.computePointsAverage(pointsPtr, points.length);
  exports.__pin(resultPtr);

  // Get memory as Float64Array to read results
  const memory = new Float64Array(exports.memory.buffer);
  const averageX = memory[resultPtr / 8];
  const averageY = memory[resultPtr / 8 + 1];

  // Clean up
  exports.__unpin(resultPtr);
  exports.__unpin(pointsPtr);

  console.log("Points:", points);
  console.log("Average X:", averageX.toFixed(2));
  console.log("Average Y:", averageY.toFixed(2));
}

init().catch(console.error);
