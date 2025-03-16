import { Point } from "./types";

export function score(point: Point): i32 {
  return i32(point.x) + i32(point.y);
}
