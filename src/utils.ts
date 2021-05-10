export function arrayAsString(arr: Array<any>): string {
  return arr
    .map((e) =>
      typeof e === "object" ? JSON.stringify(e, toPlain) : String(e)
    )
    .join(" ");
}

function toPlain(key, value) {
  if (typeof value === "object" && value instanceof Set) {
    return Array.from(value);
  }
  return value;
}
