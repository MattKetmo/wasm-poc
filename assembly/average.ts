@unmanaged
class Kline {
  constructor(
    public timestamp: i64 = 0,  // 8 bytes
    public open: f64 = 0,       // 8 bytes
    public close: f64 = 0,      // 8 bytes
    public low: f64 = 0,        // 8 bytes
    public high: f64 = 0,       // 8 bytes
    public volume: f64 = 0,     // 8 bytes
  ) {}
}

export function setKline(
  klines: StaticArray<Kline>,
  index: i32,
  timestamp: i64,
  open: f64,
  close: f64,
  low: f64,
  high: f64,
  volume: f64
): void {
  klines[index] = new Kline(timestamp, open, close, low, high, volume);
}

export function findBullishKlines(klines: StaticArray<Kline>, len: i32): StaticArray<i64> {
  // First pass: count bullish klines
  let bullishCount: i32 = 0;
  for (let i = 0; i < len; i++) {
    if (klines[i].close > klines[i].open) {
      bullishCount++;
    }
  }

  // Create result array
  const result = new StaticArray<i64>(bullishCount);

  // Second pass: fill result array
  let resultIndex: i32 = 0;
  for (let i = 0; i < len; i++) {
    if (klines[i].close > klines[i].open) {
      result[resultIndex] = klines[i].timestamp;
      resultIndex++;
    }
  }

  return result;
}
