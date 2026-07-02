const KEY = "mcc_access";

export function getUnlockedServices(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function unlockService(tier: string): void {
  const current = getUnlockedServices();
  if (!current.includes(tier)) {
    localStorage.setItem(KEY, JSON.stringify([...current, tier]));
  }
}

export function hasAccess(serviceId: string): boolean {
  const services = getUnlockedServices();
  return services.includes(serviceId) || services.includes("bundle");
}
