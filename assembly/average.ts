export function computeAverage(arr: StaticArray<f64>): f64 {
  let sum: f64 = 0;
  let length = arr.length;

  if (length === 0) return 0;

  for (let i = 0; i < length; i++) {
    sum += arr[i];
  }

  return sum / f64(length);
}
