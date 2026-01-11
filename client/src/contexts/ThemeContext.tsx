import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorTheme = "blue" | "emerald" | "violet" | "rose" | "orange";

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultColorTheme = "blue",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("colorTheme");
      return (stored as ColorTheme) || defaultColorTheme;
    }
    return defaultColorTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all color theme classes
    root.classList.remove("theme-blue", "theme-emerald", "theme-violet", "theme-rose", "theme-orange");
    
    // Add current color theme class (except blue which is default)
    if (colorTheme !== "blue") {
      root.classList.add(`theme-${colorTheme}`);
    }

    if (switchable) {
      localStorage.setItem("colorTheme", colorTheme);
    }
  }, [colorTheme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setColorTheme = (newColorTheme: ColorTheme) => {
    if (switchable) {
      setColorThemeState(newColorTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, setColorTheme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
