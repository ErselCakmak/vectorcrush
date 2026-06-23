export function normalizeNumbers(svg: string, precision: number): string {
  const numericAttributes = new Set([
    "cx",
    "cy",
    "height",
    "opacity",
    "r",
    "rx",
    "ry",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "viewBox",
    "width",
    "x",
    "x1",
    "x2",
    "y",
    "y1",
    "y2"
  ]);

  const tagPattern = /<([A-Za-z][\w:.-]*)(\s+[^<>]*?)?(\/?)>/g;
  const attrPattern = /([:\w.-]+)(\s*=\s*)(".*?"|'.*?'|[^\s"'>/]+)/g;

  return svg.replace(tagPattern, (full, tagName: string, rawAttrs: string | undefined, selfClose: string) => {
    if (!rawAttrs || full.startsWith("</")) return full;

    const attrs = rawAttrs.replace(attrPattern, (raw, name: string, separator: string, rawValue: string) => {
      if (!numericAttributes.has(name)) return raw;

      const quote = rawValue.startsWith("\"") || rawValue.startsWith("'") ? rawValue[0] : "";
      const unquotedValue = quote ? rawValue.slice(1, -1) : rawValue;
      const normalized = normalizeNumericList(unquotedValue, precision);

      if (normalized === unquotedValue) return raw;
      return `${name}${separator}${quote}${normalized}${quote}`;
    });

    return `<${tagName}${attrs}${selfClose}>`;
  });
}

function normalizeNumericList(value: string, precision: number): string {
  const parts = value.match(/-?\d+(?:\.\d+)?/g);
  if (!parts) return value;

  const separators = value.split(/-?\d+(?:\.\d+)?/g);
  if (separators.join("").trim().replaceAll(",", "") !== "") return value;

  let output = separators[0] ?? "";
  for (let index = 0; index < parts.length; index += 1) {
    output += normalizeNumericToken(parts[index] ?? "", precision);
    output += separators[index + 1] ?? "";
  }

  return output;
}

function normalizeNumericToken(raw: string, precision: number): string {
  if (!raw.includes(".")) return raw;

  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;

  const fixed = value.toFixed(precision);
  return fixed
    .replace(/\.?0+$/u, "")
    .replace(/^-0$/u, "0");
}
