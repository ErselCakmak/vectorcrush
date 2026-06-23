import type { OptimizeResult, PassReport, VectorCrushOptions } from "./types.js";
import { byteLength, clampPrecision, runStringPass } from "./utils.js";
import { removeComments as removeCommentsPass } from "./passes/remove-comments.js";
import { removeMetadata as removeMetadataPass } from "./passes/remove-metadata.js";
import { normalizeWhitespace } from "./passes/normalize-whitespace.js";
import { normalizeNumbers } from "./passes/normalize-numbers.js";
import { sortAttributesDeterministically } from "./passes/sort-attributes.js";

export type { OptimizeResult, PassReport, VectorCrushOptions } from "./types.js";

export { removeCommentsPass as removeComments };
export { removeMetadataPass as removeMetadata };
export { normalizeWhitespace };
export { normalizeNumbers };
export { sortAttributesDeterministically };

export function optimizeSvg(input: string, options: VectorCrushOptions = {}): OptimizeResult {
  const beforeBytes = byteLength(input);
  const reports: PassReport[] = [];
  let svg = input;

  if (options.removeComments !== false) {
    const result = runStringPass("removeComments", svg, removeCommentsPass);
    svg = result.output;
    reports.push(result.report);
  }

  if (options.removeMetadata === true) {
    const result = runStringPass("removeMetadata", svg, removeMetadataPass);
    svg = result.output;
    reports.push(result.report);
  }

  {
    const precision = clampPrecision(options.precision);
    const result = runStringPass("normalizeNumbers", svg, (value) => normalizeNumbers(value, precision));
    svg = result.output;
    reports.push(result.report);
  }

  {
    const result = runStringPass("sortAttributesDeterministically", svg, sortAttributesDeterministically);
    svg = result.output;
    reports.push(result.report);
  }

  {
    const result = runStringPass("normalizeWhitespace", svg, normalizeWhitespace);
    svg = result.output;
    reports.push(result.report);
  }

  const afterBytes = byteLength(svg);

  return {
    svg,
    beforeBytes,
    afterBytes,
    savedBytes: beforeBytes - afterBytes,
    reports
  };
}
