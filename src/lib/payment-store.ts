type Status = "pending" | "success" | "failed";
interface Entry { tier: string; status: Status }

// Module-level map — lives in the server process.
// Callback and status-poll routes share this within the same instance.
const store = new Map<string, Entry>();

export function setPending(ref: string, tier: string) {
  store.set(ref, { tier, status: "pending" });
  setTimeout(() => store.delete(ref), 10 * 60 * 1000); // auto-clean after 10 min
}

export function resolve(ref: string, status: "success" | "failed") {
  const entry = store.get(ref);
  if (entry) store.set(ref, { ...entry, status });
}

export function getStatus(ref: string): Entry | undefined {
  return store.get(ref);
}
