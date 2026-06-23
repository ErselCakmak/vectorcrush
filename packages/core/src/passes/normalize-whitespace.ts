export function normalizeWhitespace(svg: string): string {
  return svg
    .replace(/>\s+</g, "><")
    .trim();
}
