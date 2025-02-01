import { Kline } from './types';
import { screener } from './screener';

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

  // const kl = klines.slice(0, len)
  // return i32(kl[kl.length - 1].timestamp);

  // return klines[0].close > klines[0].open ? 1 : 0;
  // return klines[0].open > klines[1].open ? 1 : 0;
  // return klines[0].close > klines[0].open ? 1 : 0;
  return screener(klines.slice(0, len));
}

export const KlineArray_ID = idof<StaticArray<Kline>>();

// @external("client", "screener")
// declare function screener(klines: StaticArray<Kline>): i32;
// declare function screener(open: f64, close: f64): i32;

// function screener0(klines: StaticArray<Kline>): i32 {
//   return klines[0].close < klines[0].open ? 1 : 0;
// }

// This is just a declaration - the actual implementation will be in client code
// @external("client", "test")
// declare function test(): i32;
