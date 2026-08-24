"use client";

import { useEffect } from "react";

const LEGACY_PII_KEYS = [
  "careercraft_cv_builder_draft",
  "careercraft_cv_transform",
];

export function PrivacyStorageCleanup() {
  useEffect(() => {
    for (const key of LEGACY_PII_KEYS) localStorage.removeItem(key);
  }, []);

  return null;
}
