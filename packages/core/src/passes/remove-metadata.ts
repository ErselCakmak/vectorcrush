export function removeMetadata(svg: string): string {
  return svg.replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/gi, "");
}
