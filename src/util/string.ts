export function normalizeContent(content: string): string {
  return content.replaceAll('\r\n', '\n').trim();
}
