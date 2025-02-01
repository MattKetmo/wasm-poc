import { Kline } from "../assembly/types";


// export function screener(open: f64, close: f64): i32 {
//   return close > open ? 1 : 0;
// }

export function screener(klines: Kline[]): i32 {
  return i32(klines[klines.length - 1].close - klines[klines.length - 1].open);
}

export function test(): i32 {
  return 1;
}
