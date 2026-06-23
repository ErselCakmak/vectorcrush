const TAG_PATTERN = /<([A-Za-z][\w:.-]*)(\s+[^<>]*?)?(\/?)>/g;
const ATTR_PATTERN = /([:\w.-]+)(?:\s*=\s*(".*?"|'.*?'|[^\s"'>/]+))?/g;

const PRIORITY = new Map<string, number>([
  ["xmlns", 0],
  ["viewBox", 1],
  ["width", 2],
  ["height", 3],
  ["x", 4],
  ["y", 5],
  ["d", 6],
  ["fill", 7],
  ["stroke", 8],
  ["class", 9],
  ["id", 10]
]);

function attrRank(name: string): number {
  return PRIORITY.get(name) ?? 100;
}

function compareAttributeNames(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function sortAttributesDeterministically(svg: string): string {
  return svg.replace(TAG_PATTERN, (full, tagName: string, rawAttrs: string | undefined, selfClose: string) => {
    if (!rawAttrs || full.startsWith("</")) return full;

    const attrs: Array<{ name: string; raw: string }> = [];
    for (const match of rawAttrs.trim().matchAll(ATTR_PATTERN)) {
      const raw = match[0].trim();
      const name = match[1];
      if (!raw || !name) continue;
      attrs.push({ name, raw });
    }

    if (attrs.length === 0) return `<${tagName}${selfClose}>`;

    attrs.sort((a, b) => {
      const rankDelta = attrRank(a.name) - attrRank(b.name);
      if (rankDelta !== 0) return rankDelta;
      return compareAttributeNames(a.name, b.name);
    });

    return `<${tagName} ${attrs.map((attr) => attr.raw).join(" ")}${selfClose}>`;
  });
}
