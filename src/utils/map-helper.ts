export function getKeyByValue(map: Map<string, any>, targetValue: any): string | undefined {
  for (const [key, value] of map) {
    if (value === targetValue) {
      return key;
    }
  }
  return undefined;
}
