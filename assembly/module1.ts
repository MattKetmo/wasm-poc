import { Point } from "./types";

declare function implement(foobar: Point): i32;

export function entrypoint(): i32 {
  const point = new Point(3, 6);
  return implement(point);
}
