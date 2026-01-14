'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDarkMode(isDark);
    applyTheme(isDark);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    applyTheme(newDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <span className="text-xl">☀️</span>
      ) : (
        <span className="text-xl">🌙</span>
      )}
    </button>
  );
}
