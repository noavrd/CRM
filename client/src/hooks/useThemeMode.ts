import * as React from "react";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "theme-mode";

function getSystemPref(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredMode(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export function useThemeMode() {
  const [mode, setMode] = React.useState<ThemeMode>(() => {
    return readStoredMode() ?? getSystemPref() ?? "light";
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  React.useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;

    const handler = () => {
      if (!readStoredMode()) {
        setMode(mql.matches ? "dark" : "light");
      }
    };
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  const toggleMode = React.useCallback(
    () => setMode((m) => (m === "light" ? "dark" : "light")),
    []
  );

  return { mode, setMode, toggleMode };
}
