import { Point } from "./types";

export function score(points: Point[]): i32 {
  // Calculate the sum of the x coordinates
  return points.reduce((acc, point) => acc + i32(point.x), 0);
}
