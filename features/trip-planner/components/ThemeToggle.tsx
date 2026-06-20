"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "ai-travel-board-theme";
const THEME_CHANGE_EVENT = "ai-travel-board-theme-change";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`${nextTheme === "dark" ? "다크" : "라이트"} 모드로 전환`}
      className="theme-toggle"
      onClick={() => setTheme(nextTheme)}
      title={`${nextTheme === "dark" ? "다크" : "라이트"} 모드로 전환`}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle-icon">
        {theme === "dark" ? "☀" : "☾"}
      </span>
    </button>
  );
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
