export function matchesSearch(
  query: string,
  ...values: (string | number | null | undefined)[]
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return values.some(
    (v) => v != null && String(v).toLowerCase().includes(trimmed)
  );
}
