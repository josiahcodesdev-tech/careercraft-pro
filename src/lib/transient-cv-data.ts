// Deliberately memory-only: CV content can contain highly sensitive personal
// information and must not be persisted in browser storage.
let transformedCv: unknown = null;

export function storeTransformedCv(value: unknown): void {
  transformedCv = value;
}

export function takeTransformedCv(): unknown {
  const value = transformedCv;
  transformedCv = null;
  return value;
}
