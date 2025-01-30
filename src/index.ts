import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface WasmExports {
  memory: WebAssembly.Memory;
  analyzeKlines: (ptr: number, len: number) => number;
  setKline: (
    arrayPtr: number,
    index: number,
    timestamp: bigint,
    open: number,
    close: number,
    low: number,
    high: number,
    volume: number
  ) => void;
  __new: (len: number, id: number) => number;
  __pin: (ptr: number) => number;
  __unpin: (ptr: number) => void;
}

interface Kline {
  timestamp: bigint;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

function analyzeKlines(exports: WasmExports, klines: Kline[]): number {
  // Allocate memory for the klines array
  // Size is number of klines * size of Kline (48 bytes: 8+8+8+8+8+8)
  const klinesPtr = exports.__new(klines.length * 48, 3); // 3 for StaticArray
  exports.__pin(klinesPtr);

  // Use the helper function to set klines in memory
  klines.forEach((kline, i) => {
    exports.setKline(
      klinesPtr,
      i,
      kline.timestamp,
      kline.open,
      kline.close,
      kline.low,
      kline.high,
      kline.volume
    );
  });

  // Find bullish klines
  return exports.analyzeKlines(klinesPtr, klines.length);
}

async function init() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const wasmBuffer = readFileSync(join(__dirname, '../build/release.wasm'));

  const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
    env: {
      abort: (msg: number, file: number, line: number, column: number) => {
        console.error('Abort called from wasm');
      },
    },
  });

  const exports = wasmModule.instance.exports as unknown as WasmExports;

  // Test klines (10 entries)
  const klines: Kline[] = [
    // Timestamps are in milliseconds
    { timestamp: 1706373900000n, open: 42550.75, close: 42650.25, low: 42530.00, high: 42680.50, volume: 105.1 },   // Bullish
    { timestamp: 1706373600000n, open: 42400.25, close: 42550.75, low: 42390.50, high: 42600.00, volume: 115.9 },  // Bullish
    { timestamp: 1706373300000n, open: 42450.50, close: 42400.25, low: 42380.00, high: 42480.25, volume: 92.8 },   // Bearish
    { timestamp: 1706373000000n, open: 42320.25, close: 42450.50, low: 42310.75, high: 42500.00, volume: 130.2 },  // Bullish
    { timestamp: 1706372700000n, open: 42350.75, close: 42320.25, low: 42300.00, high: 42380.50, volume: 88.6 },   // Bearish
    { timestamp: 1706372400000n, open: 42200.25, close: 42350.75, low: 42180.50, high: 42400.00, volume: 110.4 },  // Bullish
    { timestamp: 1706372100000n, open: 42250.50, close: 42200.25, low: 42150.00, high: 42280.25, volume: 95.2 },   // Bearish
    { timestamp: 1706371800000n, open: 42100.25, close: 42250.50, low: 42090.75, high: 42300.00, volume: 120.7 },  // Bullish
    { timestamp: 1706371500000n, open: 42150.75, close: 42100.25, low: 42080.00, high: 42180.50, volume: 85.3 },   // Bearish
    { timestamp: 1706371200000n, open: 42000.50, close: 42150.75, low: 41950.25, high: 42200.00, volume: 100.5 },  // Bullish
  ];

  // Analyze each kline individually
  klines.slice(0, 10).forEach((_, i) => {
    const singleKline = klines.slice(i);
    const result = analyzeKlines(exports, singleKline);
    const date = new Date(Number(singleKline[0].timestamp));
    console.log(`Kline ${i} (${date.toISOString()}): ${result}`);
  });
}

init().catch(console.error);
