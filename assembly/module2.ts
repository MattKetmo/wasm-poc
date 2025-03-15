import { Point } from "./types";

export function implement(pt: Point): i32 {
  console.log(`point: ${pt.x}, ${pt.y}`);
  return i32(pt.x) + i32(pt.y);
}
