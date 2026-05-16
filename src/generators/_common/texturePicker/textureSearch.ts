export function normalizeTextureSearch(value: string): string {
  return value.toLowerCase().replace(/_/g, " ");
}

export function matchesTextureSearch(
  frameName: string,
  search: string
): boolean {
  return normalizeTextureSearch(frameName).includes(
    normalizeTextureSearch(search)
  );
}
