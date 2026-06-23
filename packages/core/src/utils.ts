import type { PassReport } from "./types.js";

export function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

export function runStringPass(
  name: string,
  input: string,
  pass: (svg: string) => string
): { output: string; report: PassReport } {
  const output = pass(input);
  return {
    output,
    report: {
      name,
      changed: output !== input,
      beforeBytes: byteLength(input),
      afterBytes: byteLength(output)
    }
  };
}

export function clampPrecision(precision: number | undefined): number {
  if (precision === undefined) return 3;
  if (!Number.isInteger(precision) || precision < 0 || precision > 8) {
    throw new Error("precision must be an integer between 0 and 8");
  }
  return precision;
}
