export function orgFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string {
  const raw =
    (headers['x-org'] as string) ??
    (headers['X-Org'] as string) ??
    (headers['x-org-slug'] as string) ??
    '';
  return String(raw || '').trim();
}