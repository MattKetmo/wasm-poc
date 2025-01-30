import { Kline } from './types';

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

export function analyzeKlines(klines: StaticArray<Kline>, len: i32): i32 {
  // Count bullish klines
  if (len === 0) {
    return 0;
  }

  return klines[0].close > klines[0].open ? 1 : 0;
}
