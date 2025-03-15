# WASM POC with AssemblyScript Transformer

This project demonstrates how to use a custom AssemblyScript transformer to automatically generate an entrypoint function.

## How it works

1. The transformer looks for functions marked with a special comment `// @entrypoint`
2. It automatically generates an `entrypoint()` function that creates a Point(3, 6) and calls the marked function
3. This allows the WASM module to be called from JavaScript without having to manually create the Point object

## Example

```typescript
// In assembly/module1.ts
import { Point } from "./types";

// @entrypoint
export function score(point: Point): i32 {
  return i32(point.x) + i32(point.y);
}
```

The transformer will automatically generate:

```typescript
export function entrypoint(): i32 {
  const point = new Point(3, 6);
  return score(point);
}
```

## Usage

1. Mark any function with `// @entrypoint` comment
2. Build the project with `npm run asbuild`
3. Run the example with `npm start`
4. Test the transformer with `npm run test:transformer`

## How the transformer works

The transformer is implemented in `scripts/transformer.cjs`. It:

1. Scans all source files during the AssemblyScript compilation process
2. Looks for functions marked with the special comment
3. Generates the entrypoint function that creates a Point(3, 6) and calls the marked function
4. Adds the generated function to the source file

This approach avoids having to manually create the Point object in each module.

## Implementation Notes

- The transformer uses CommonJS module format (`.cjs` extension) to be compatible with the AssemblyScript compiler
- It uses multiple approaches to find the special comment, making it robust across different AssemblyScript versions
- The test script (`scripts/test-transformer.cjs`) verifies all approaches work correctly
