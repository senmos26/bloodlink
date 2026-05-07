export function mapToSnakeCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const snakeCaseObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      snakeCaseObj[snakeKey] = obj[key];
    }
  }
  return snakeCaseObj;
}
