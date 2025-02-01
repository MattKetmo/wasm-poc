import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as loader from "@assemblyscript/loader";

type Kline = {
  timestamp: number;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
};

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface ClientExports {
  memory: WebAssembly.Memory;
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
  __collect: () => void;
  __new: (size: number, id: number) => number;
  __newArray: <T>(id: number, arr: T[]) => number;
  KlineArray_ID: number;
  setKline: (
    arr: number,
    index: number,
    timestamp: bigint,
    open: number,
    close: number,
    low: number,
    high: number,
    volume: number
  ) => void;
  analyzeKlines: (arr: number, length: number) => number;
}

interface ScreenerExports {
  memory: WebAssembly.Memory;
  screener: (arr: number) => number;
}

async function initWasm() {
  // Read both WASM files
  const clientWasm = fs.readFileSync(path.resolve(__dirname, '../build/release.wasm'));
  const screenerWasm = fs.readFileSync(path.resolve(__dirname, '../build/screener.wasm'));

  // Create shared memory
  const memory = new WebAssembly.Memory({ shared: true, initial: 100, maximum: 1000 });

  const env = {
    abort: (_msg: number, _file: number, line: number, column: number) => {
      console.error(`Abort at ${line}:${column}`);
    },
    memory,
  };

  // Instantiate screener module first using the loader
  const screenerModule = await loader.instantiate(screenerWasm, {
    env,
  });

  // Instantiate client module using the loader
  const clientModule = await loader.instantiate(clientWasm, {
    env,
    screener: {
      screener: (ptr: number) => {
        console.log('screener', ptr);
        return (screenerModule.exports as unknown as ScreenerExports).screener(ptr)
      }
    }
  });

  return {
    clientExports: clientModule.exports as unknown as ClientExports,
    screenerExports: screenerModule.exports as unknown as ScreenerExports,
  };
}

// Usage example
async function analyze(klines: Kline[]) {
  const { clientExports } = await initWasm();

  // Create array in WebAssembly memory
  // const arrayPtr = clientExports.__newArray(clientExports.KlineArray_ID, klines);
  // const pinnedPtr = clientExports.__pin(arrayPtr);

  const arrayPtr = clientExports.__new(klines.length * 16, clientExports.KlineArray_ID);
  const pinnedPtr = clientExports.__pin(arrayPtr);
  console.log('arrayPtr', arrayPtr);
  console.log('pinnedPtr', pinnedPtr);

  // Fill the array with kline data
  klines.forEach((kline, index) => {
    clientExports.setKline(
      pinnedPtr,
      index,
      BigInt(kline.timestamp),
      kline.open,
      kline.close,
      kline.low,
      kline.high,
      kline.volume
    );
  });

  try {
    // Analyze the klines
    const result = clientExports.analyzeKlines(pinnedPtr, klines.length);
    return result;
  } finally {
    clientExports.__unpin(pinnedPtr);
    clientExports.__collect();
  }
}

// Example usage
async function main() {
  const testKlines: Kline[] = [
    {
      timestamp: Date.now(),
      open: 100,
      close: 105,
      low: 98,
      high: 106,
      volume: 1000
    },
    {
      timestamp: Date.now(),
      open: 99,
      close: 100,
      low: 98,
      high: 106,
      volume: 1000
    },
    {
      timestamp: Date.now(),
      open: 99,
      close: 100,
      low: 98,
      high: 106,
      volume: 1000
    },
    {
      timestamp: Date.now(),
      open: 80,
      close: 100,
      low: 98,
      high: 106,
      volume: 1000
    }
  ];

  const score = await analyze(testKlines);
  console.log('Analysis score:', score);
}

main().catch(console.error);
