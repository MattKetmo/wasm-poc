import { Kline } from "../assembly/types";

export function screener(klines: Kline[]): i32 {
  return klines[0].close > klines[0].open ? 1 : 0;
}
