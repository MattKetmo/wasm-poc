import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  __new: (size: number, id: number) => number;
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

  // Increase initial memory pages (each page is 64KB)
  const memory = new WebAssembly.Memory({ initial: 100, maximum: 1000 }); // Increased memory


  // Create import object for screener module
  const screenerImports = {
    env: {
      abort: (_msg: number, _file: number, line: number, column: number) => {
        console.error(`Abort at ${line}:${column}`);
      },
      memory,
    }
  };

  // Instantiate screener module first
  const screenerModule = await WebAssembly.instantiate(screenerWasm, screenerImports);
  const screenerExports = screenerModule.instance.exports as unknown as ScreenerExports;

  // Create import object for client module
  const clientImports = {
    env: {
      abort: (_msg: number, _file: number, line: number, column: number) => {
        console.error(`Abort at ${line}:${column}`);
      },
      memory,
    },
    client: {
      screener: (arr: number) => screenerExports.screener(arr)
    }
  };

  // Instantiate client module
  const clientModule = await WebAssembly.instantiate(clientWasm, clientImports);
  const clientExports = clientModule.instance.exports as unknown as ClientExports;

  return { clientExports, screenerExports };
}

// Usage example
async function analyze(klines: Kline[]) {
  const { clientExports } = await initWasm();

  // Allocate memory for the array (assuming id 1 for array type)
  const arrayPtr = clientExports.__new(klines.length * 16, 1);
  const pinnedPtr = clientExports.__pin(arrayPtr);

  try {
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

    // Analyze the klines
    const result = clientExports.analyzeKlines(pinnedPtr, klines.length);
    return result;
  } finally {
    clientExports.__unpin(pinnedPtr);
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
    }
  ];

  const score = await analyze(testKlines);
  console.log('Analysis score:', score);
}

main().catch(console.error);
