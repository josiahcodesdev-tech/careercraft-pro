"use client";

import { useEffect, useState } from "react";

/**
 * Whether the site is currently charging for downloads.
 *
 * Returns null while the flag is still loading. Callers must treat null as
 * "charging" — that way a slow or failed response shows the paywall rather
 * than silently giving work away. The real enforcement is server-side in
 * /api/cv-events and /api/interview-events; this only decides what the form
 * renders.
 */
export function usePaymentsEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/payments/enabled")
      .then((res) => res.json())
      .then((json: { enabled?: boolean }) => {
        if (!cancelled) setEnabled(json.enabled !== false);
      })
      .catch(() => {
        if (!cancelled) setEnabled(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
