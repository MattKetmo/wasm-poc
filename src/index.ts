import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface WasmExports {
  memory: WebAssembly.Memory;
  computeAverage: (ptr: number, len: number) => number;
  __new: (len: number, id: number) => number;
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
}

async function init() {
  // Get current file directory
  const __dirname = fileURLToPath(new URL('.', import.meta.url));

  // Read the wasm file
  const wasmPath = join(__dirname, '../build/average.wasm');
  const wasmBuffer = readFileSync(wasmPath);

  // Instantiate the WebAssembly module
  const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
    env: {
      abort: (msg: number, file: number, line: number, column: number) => {
        console.error('Abort called from wasm');
      },
    },
  });

  const exports = wasmModule.instance.exports as unknown as WasmExports;

  // Create test array with 10 numbers
  const numbers = [2.5, 4.7, 8.1, 1.3, 9.2, 6.4, 3.8, 7.5, 5.9, 2.6];

  // Allocate memory for the array (Float64Array = 8 bytes per number)
  const arrayPtr = exports.__new(numbers.length * 8, 1);
  exports.__pin(arrayPtr);

  // Get memory as Float64Array
  const memory = new Float64Array(exports.memory.buffer);

  // Copy numbers to WebAssembly memory
  numbers.forEach((num, i) => {
    memory[arrayPtr / 8 + i] = num;
  });

  // Compute average using WASM
  const average = exports.computeAverage(arrayPtr, numbers.length);

  // Clean up
  exports.__unpin(arrayPtr);

  console.log("Numbers:", numbers);
  console.log("Average:", average.toFixed(2));
}

init().catch(console.error);
