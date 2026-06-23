export function removeComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "");
}
