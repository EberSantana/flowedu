import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WidgetTheme = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeColors {
  border: string;
  icon: string;
  name: string;
  description: string;
}

const themeColors: Record<WidgetTheme, ThemeColors> = {
  blue: {
    border: 'border-blue-500',
    icon: 'text-blue-600',
    name: 'Azul Profissional',
    description: 'Tema clássico e profissional'
  },
  green: {
    border: 'border-green-500',
    icon: 'text-green-600',
    name: 'Verde Educação',
    description: 'Tema inspirador e natural'
  },
  purple: {
    border: 'border-purple-500',
    icon: 'text-purple-600',
    name: 'Roxo Criativo',
    description: 'Tema criativo e moderno'
  },
  orange: {
    border: 'border-orange-500',
    icon: 'text-orange-600',
    name: 'Laranja Energético',
    description: 'Tema vibrante e energético'
  }
};

interface WidgetThemeContextType {
  theme: WidgetTheme;
  setTheme: (theme: WidgetTheme) => void;
  getThemeColors: () => ThemeColors;
  getAllThemes: () => Array<{ key: WidgetTheme; colors: ThemeColors }>;
}

const WidgetThemeContext = createContext<WidgetThemeContextType | undefined>(undefined);

export function WidgetThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<WidgetTheme>(() => {
    const saved = localStorage.getItem('widgetTheme');
    return (saved as WidgetTheme) || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('widgetTheme', theme);
  }, [theme]);

  const setTheme = (newTheme: WidgetTheme) => {
    setThemeState(newTheme);
  };

  const getThemeColors = () => themeColors[theme];

  const getAllThemes = () => {
    return Object.entries(themeColors).map(([key, colors]) => ({
      key: key as WidgetTheme,
      colors
    }));
  };

  return (
    <WidgetThemeContext.Provider value={{ theme, setTheme, getThemeColors, getAllThemes }}>
      {children}
    </WidgetThemeContext.Provider>
  );
}

export function useWidgetTheme() {
  const context = useContext(WidgetThemeContext);
  if (context === undefined) {
    throw new Error('useWidgetTheme must be used within a WidgetThemeProvider');
  }
  return context;
}
