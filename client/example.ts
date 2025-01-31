import { Kline } from "../assembly/types";

// export function screener(open: f64, close: f64): i32 {
//   return close > open ? 1 : 0;
// }

export function screener(klines: StaticArray<Kline>): i32 {
  return klines[0].close > klines[0].open ? 1 : 0;
}

export function test(): i32 {
  return 1;
}
