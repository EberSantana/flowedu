/**
 * Sistema de Temas Pré-definidos
 * 
 * Cada tema define uma paleta de cores completa usando OKLCH para melhor
 * consistência visual. Os temas são aplicados via CSS custom properties.
 */

export interface ThemeColors {
  // Cores principais
  primary: string;
  primaryForeground: string;
  
  // Cores semânticas
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  
  // Sidebar
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarForeground: string;
  sidebar: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  
  // Cores de fundo e texto
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  
  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;    // Cor principal para preview
    secondary: string;  // Cor secundária para preview
    accent: string;     // Cor de destaque para preview
  };
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: ThemeDefinition[] = [
  {
    id: "default",
    name: "Padrão",
    description: "Tema neutro e profissional em tons de cinza azulado",
    preview: {
      primary: "#5c6b7a",
      secondary: "#e8eaed",
      accent: "#6b7a8c",
    },
    light: {
      primary: "oklch(0.45 0.03 240)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.06 150)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.08 80)",
      warningForeground: "oklch(0.25 0 0)",
      info: "oklch(0.52 0.05 235)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.42 0.03 240)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.32 0.01 240)",
      sidebar: "oklch(0.97 0.003 240)",
      sidebarAccent: "oklch(0.93 0.008 240)",
      sidebarAccentForeground: "oklch(0.28 0.01 240)",
      sidebarBorder: "oklch(0.88 0.005 240)",
      sidebarRing: "oklch(0.48 0.04 240)",
      background: "oklch(0.98 0.002 240)",
      foreground: "oklch(0.28 0.01 240)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.28 0.01 240)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.28 0.01 240)",
      secondary: "oklch(0.95 0.005 240)",
      secondaryForeground: "oklch(0.35 0.01 240)",
      muted: "oklch(0.96 0.005 240)",
      mutedForeground: "oklch(0.50 0.01 240)",
      accent: "oklch(0.94 0.008 240)",
      accentForeground: "oklch(0.30 0.01 240)",
      destructive: "oklch(0.50 0.12 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.005 240)",
      input: "oklch(0.90 0.005 240)",
      ring: "oklch(0.48 0.04 240)",
      chart1: "oklch(0.50 0.04 240)",
      chart2: "oklch(0.55 0.05 200)",
      chart3: "oklch(0.58 0.04 160)",
      chart4: "oklch(0.52 0.05 280)",
      chart5: "oklch(0.54 0.04 320)",
    },
    dark: {
      primary: "oklch(0.58 0.04 240)",
      primaryForeground: "oklch(0.15 0 0)",
      success: "oklch(0.60 0.07 150)",
      successForeground: "oklch(0.15 0 0)",
      warning: "oklch(0.68 0.09 80)",
      warningForeground: "oklch(0.15 0 0)",
      info: "oklch(0.60 0.06 235)",
      infoForeground: "oklch(0.15 0 0)",
      sidebarPrimary: "oklch(0.55 0.04 240)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.82 0.01 240)",
      sidebar: "oklch(0.18 0.01 240)",
      sidebarAccent: "oklch(0.26 0.012 240)",
      sidebarAccentForeground: "oklch(0.92 0.01 240)",
      sidebarBorder: "oklch(0.32 0.01 240)",
      sidebarRing: "oklch(0.52 0.05 240)",
      background: "oklch(0.16 0.008 240)",
      foreground: "oklch(0.85 0.01 240)",
      card: "oklch(0.20 0.01 240)",
      cardForeground: "oklch(0.85 0.01 240)",
      popover: "oklch(0.20 0.01 240)",
      popoverForeground: "oklch(0.85 0.01 240)",
      secondary: "oklch(0.24 0.01 240)",
      secondaryForeground: "oklch(0.75 0.01 240)",
      muted: "oklch(0.28 0.01 240)",
      mutedForeground: "oklch(0.65 0.01 240)",
      accent: "oklch(0.28 0.012 240)",
      accentForeground: "oklch(0.88 0.01 240)",
      destructive: "oklch(0.55 0.14 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.32 0.01 240)",
      input: "oklch(0.30 0.012 240)",
      ring: "oklch(0.52 0.05 240)",
      chart1: "oklch(0.50 0.04 240)",
      chart2: "oklch(0.55 0.05 200)",
      chart3: "oklch(0.58 0.04 160)",
      chart4: "oklch(0.52 0.05 280)",
      chart5: "oklch(0.54 0.04 320)",
    },
  },
  {
    id: "ocean",
    name: "Oceano",
    description: "Tons de azul profundo inspirados no mar",
    preview: {
      primary: "#1e6091",
      secondary: "#e3f2fd",
      accent: "#0288d1",
    },
    light: {
      primary: "oklch(0.45 0.12 230)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.10 160)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.12 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.10 220)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.40 0.12 230)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.30 0.02 230)",
      sidebar: "oklch(0.97 0.01 230)",
      sidebarAccent: "oklch(0.92 0.02 230)",
      sidebarAccentForeground: "oklch(0.25 0.02 230)",
      sidebarBorder: "oklch(0.88 0.02 230)",
      sidebarRing: "oklch(0.50 0.10 230)",
      background: "oklch(0.98 0.005 230)",
      foreground: "oklch(0.25 0.02 230)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.02 230)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.25 0.02 230)",
      secondary: "oklch(0.94 0.015 230)",
      secondaryForeground: "oklch(0.35 0.02 230)",
      muted: "oklch(0.95 0.01 230)",
      mutedForeground: "oklch(0.50 0.02 230)",
      accent: "oklch(0.93 0.02 230)",
      accentForeground: "oklch(0.30 0.02 230)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.015 230)",
      input: "oklch(0.90 0.01 230)",
      ring: "oklch(0.50 0.10 230)",
      chart1: "oklch(0.45 0.12 230)",
      chart2: "oklch(0.55 0.10 200)",
      chart3: "oklch(0.50 0.08 180)",
      chart4: "oklch(0.48 0.10 250)",
      chart5: "oklch(0.52 0.08 210)",
    },
    dark: {
      primary: "oklch(0.60 0.12 230)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.10 160)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.12 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.10 220)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.55 0.12 230)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 230)",
      sidebar: "oklch(0.15 0.02 230)",
      sidebarAccent: "oklch(0.25 0.03 230)",
      sidebarAccentForeground: "oklch(0.92 0.01 230)",
      sidebarBorder: "oklch(0.30 0.02 230)",
      sidebarRing: "oklch(0.55 0.10 230)",
      background: "oklch(0.14 0.015 230)",
      foreground: "oklch(0.88 0.02 230)",
      card: "oklch(0.18 0.02 230)",
      cardForeground: "oklch(0.88 0.02 230)",
      popover: "oklch(0.18 0.02 230)",
      popoverForeground: "oklch(0.88 0.02 230)",
      secondary: "oklch(0.22 0.02 230)",
      secondaryForeground: "oklch(0.78 0.02 230)",
      muted: "oklch(0.26 0.02 230)",
      mutedForeground: "oklch(0.68 0.02 230)",
      accent: "oklch(0.26 0.025 230)",
      accentForeground: "oklch(0.90 0.02 230)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.30 0.02 230)",
      input: "oklch(0.28 0.025 230)",
      ring: "oklch(0.55 0.10 230)",
      chart1: "oklch(0.55 0.12 230)",
      chart2: "oklch(0.60 0.10 200)",
      chart3: "oklch(0.55 0.08 180)",
      chart4: "oklch(0.52 0.10 250)",
      chart5: "oklch(0.58 0.08 210)",
    },
  },
  {
    id: "forest",
    name: "Floresta",
    description: "Tons de verde natural e relaxante",
    preview: {
      primary: "#2e7d32",
      secondary: "#e8f5e9",
      accent: "#43a047",
    },
    light: {
      primary: "oklch(0.48 0.12 145)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.52 0.12 145)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.12 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.08 200)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.42 0.12 145)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.30 0.03 145)",
      sidebar: "oklch(0.97 0.015 145)",
      sidebarAccent: "oklch(0.92 0.025 145)",
      sidebarAccentForeground: "oklch(0.25 0.03 145)",
      sidebarBorder: "oklch(0.88 0.02 145)",
      sidebarRing: "oklch(0.50 0.10 145)",
      background: "oklch(0.98 0.008 145)",
      foreground: "oklch(0.25 0.03 145)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.25 0.03 145)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.25 0.03 145)",
      secondary: "oklch(0.94 0.02 145)",
      secondaryForeground: "oklch(0.35 0.03 145)",
      muted: "oklch(0.95 0.015 145)",
      mutedForeground: "oklch(0.50 0.03 145)",
      accent: "oklch(0.93 0.025 145)",
      accentForeground: "oklch(0.30 0.03 145)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.02 145)",
      input: "oklch(0.90 0.015 145)",
      ring: "oklch(0.50 0.10 145)",
      chart1: "oklch(0.48 0.12 145)",
      chart2: "oklch(0.55 0.10 120)",
      chart3: "oklch(0.50 0.08 170)",
      chart4: "oklch(0.52 0.10 100)",
      chart5: "oklch(0.48 0.08 160)",
    },
    dark: {
      primary: "oklch(0.62 0.12 145)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.12 145)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.12 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.08 200)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.55 0.12 145)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 145)",
      sidebar: "oklch(0.15 0.02 145)",
      sidebarAccent: "oklch(0.25 0.03 145)",
      sidebarAccentForeground: "oklch(0.92 0.02 145)",
      sidebarBorder: "oklch(0.30 0.02 145)",
      sidebarRing: "oklch(0.55 0.10 145)",
      background: "oklch(0.14 0.015 145)",
      foreground: "oklch(0.88 0.02 145)",
      card: "oklch(0.18 0.02 145)",
      cardForeground: "oklch(0.88 0.02 145)",
      popover: "oklch(0.18 0.02 145)",
      popoverForeground: "oklch(0.88 0.02 145)",
      secondary: "oklch(0.22 0.02 145)",
      secondaryForeground: "oklch(0.78 0.02 145)",
      muted: "oklch(0.26 0.02 145)",
      mutedForeground: "oklch(0.68 0.02 145)",
      accent: "oklch(0.26 0.025 145)",
      accentForeground: "oklch(0.90 0.02 145)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.30 0.02 145)",
      input: "oklch(0.28 0.025 145)",
      ring: "oklch(0.55 0.10 145)",
      chart1: "oklch(0.55 0.12 145)",
      chart2: "oklch(0.60 0.10 120)",
      chart3: "oklch(0.55 0.08 170)",
      chart4: "oklch(0.58 0.10 100)",
      chart5: "oklch(0.52 0.08 160)",
    },
  },
  {
    id: "sunset",
    name: "Pôr do Sol",
    description: "Tons quentes de laranja e coral",
    preview: {
      primary: "#e65100",
      secondary: "#fff3e0",
      accent: "#ff6d00",
    },
    light: {
      primary: "oklch(0.55 0.15 45)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.10 150)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.15 55)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.08 220)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.50 0.15 45)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.32 0.03 45)",
      sidebar: "oklch(0.97 0.015 45)",
      sidebarAccent: "oklch(0.92 0.03 45)",
      sidebarAccentForeground: "oklch(0.28 0.03 45)",
      sidebarBorder: "oklch(0.88 0.02 45)",
      sidebarRing: "oklch(0.55 0.12 45)",
      background: "oklch(0.98 0.008 45)",
      foreground: "oklch(0.28 0.03 45)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.28 0.03 45)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.28 0.03 45)",
      secondary: "oklch(0.95 0.02 45)",
      secondaryForeground: "oklch(0.38 0.03 45)",
      muted: "oklch(0.96 0.015 45)",
      mutedForeground: "oklch(0.52 0.03 45)",
      accent: "oklch(0.94 0.025 45)",
      accentForeground: "oklch(0.32 0.03 45)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.02 45)",
      input: "oklch(0.90 0.015 45)",
      ring: "oklch(0.55 0.12 45)",
      chart1: "oklch(0.55 0.15 45)",
      chart2: "oklch(0.60 0.12 30)",
      chart3: "oklch(0.52 0.10 60)",
      chart4: "oklch(0.58 0.12 15)",
      chart5: "oklch(0.50 0.10 75)",
    },
    dark: {
      primary: "oklch(0.68 0.15 45)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.10 150)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.72 0.15 55)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.08 220)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.62 0.15 45)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 45)",
      sidebar: "oklch(0.16 0.02 45)",
      sidebarAccent: "oklch(0.26 0.03 45)",
      sidebarAccentForeground: "oklch(0.92 0.02 45)",
      sidebarBorder: "oklch(0.32 0.02 45)",
      sidebarRing: "oklch(0.60 0.12 45)",
      background: "oklch(0.15 0.015 45)",
      foreground: "oklch(0.88 0.02 45)",
      card: "oklch(0.19 0.02 45)",
      cardForeground: "oklch(0.88 0.02 45)",
      popover: "oklch(0.19 0.02 45)",
      popoverForeground: "oklch(0.88 0.02 45)",
      secondary: "oklch(0.24 0.02 45)",
      secondaryForeground: "oklch(0.78 0.02 45)",
      muted: "oklch(0.28 0.02 45)",
      mutedForeground: "oklch(0.68 0.02 45)",
      accent: "oklch(0.28 0.03 45)",
      accentForeground: "oklch(0.90 0.02 45)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.32 0.02 45)",
      input: "oklch(0.30 0.025 45)",
      ring: "oklch(0.60 0.12 45)",
      chart1: "oklch(0.60 0.15 45)",
      chart2: "oklch(0.65 0.12 30)",
      chart3: "oklch(0.58 0.10 60)",
      chart4: "oklch(0.62 0.12 15)",
      chart5: "oklch(0.55 0.10 75)",
    },
  },
  {
    id: "lavender",
    name: "Lavanda",
    description: "Tons suaves de roxo e lilás",
    preview: {
      primary: "#7b1fa2",
      secondary: "#f3e5f5",
      accent: "#9c27b0",
    },
    light: {
      primary: "oklch(0.48 0.12 300)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.10 150)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.12 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.10 280)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.42 0.12 300)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.32 0.03 300)",
      sidebar: "oklch(0.97 0.015 300)",
      sidebarAccent: "oklch(0.92 0.025 300)",
      sidebarAccentForeground: "oklch(0.28 0.03 300)",
      sidebarBorder: "oklch(0.88 0.02 300)",
      sidebarRing: "oklch(0.50 0.10 300)",
      background: "oklch(0.98 0.008 300)",
      foreground: "oklch(0.28 0.03 300)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.28 0.03 300)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.28 0.03 300)",
      secondary: "oklch(0.95 0.02 300)",
      secondaryForeground: "oklch(0.38 0.03 300)",
      muted: "oklch(0.96 0.015 300)",
      mutedForeground: "oklch(0.52 0.03 300)",
      accent: "oklch(0.94 0.025 300)",
      accentForeground: "oklch(0.32 0.03 300)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.02 300)",
      input: "oklch(0.90 0.015 300)",
      ring: "oklch(0.50 0.10 300)",
      chart1: "oklch(0.48 0.12 300)",
      chart2: "oklch(0.55 0.10 280)",
      chart3: "oklch(0.50 0.08 320)",
      chart4: "oklch(0.52 0.10 260)",
      chart5: "oklch(0.48 0.08 340)",
    },
    dark: {
      primary: "oklch(0.65 0.12 300)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.10 150)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.12 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.10 280)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.58 0.12 300)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 300)",
      sidebar: "oklch(0.16 0.02 300)",
      sidebarAccent: "oklch(0.26 0.03 300)",
      sidebarAccentForeground: "oklch(0.92 0.02 300)",
      sidebarBorder: "oklch(0.32 0.02 300)",
      sidebarRing: "oklch(0.58 0.10 300)",
      background: "oklch(0.15 0.015 300)",
      foreground: "oklch(0.88 0.02 300)",
      card: "oklch(0.19 0.02 300)",
      cardForeground: "oklch(0.88 0.02 300)",
      popover: "oklch(0.19 0.02 300)",
      popoverForeground: "oklch(0.88 0.02 300)",
      secondary: "oklch(0.24 0.02 300)",
      secondaryForeground: "oklch(0.78 0.02 300)",
      muted: "oklch(0.28 0.02 300)",
      mutedForeground: "oklch(0.68 0.02 300)",
      accent: "oklch(0.28 0.03 300)",
      accentForeground: "oklch(0.90 0.02 300)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.32 0.02 300)",
      input: "oklch(0.30 0.025 300)",
      ring: "oklch(0.58 0.10 300)",
      chart1: "oklch(0.58 0.12 300)",
      chart2: "oklch(0.62 0.10 280)",
      chart3: "oklch(0.55 0.08 320)",
      chart4: "oklch(0.60 0.10 260)",
      chart5: "oklch(0.52 0.08 340)",
    },
  },
  {
    id: "rose",
    name: "Rosa",
    description: "Tons elegantes de rosa e magenta",
    preview: {
      primary: "#c2185b",
      secondary: "#fce4ec",
      accent: "#e91e63",
    },
    light: {
      primary: "oklch(0.52 0.15 350)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.10 150)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.12 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.10 320)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.48 0.15 350)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.32 0.03 350)",
      sidebar: "oklch(0.97 0.015 350)",
      sidebarAccent: "oklch(0.92 0.025 350)",
      sidebarAccentForeground: "oklch(0.28 0.03 350)",
      sidebarBorder: "oklch(0.88 0.02 350)",
      sidebarRing: "oklch(0.52 0.12 350)",
      background: "oklch(0.98 0.008 350)",
      foreground: "oklch(0.28 0.03 350)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.28 0.03 350)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.28 0.03 350)",
      secondary: "oklch(0.95 0.02 350)",
      secondaryForeground: "oklch(0.38 0.03 350)",
      muted: "oklch(0.96 0.015 350)",
      mutedForeground: "oklch(0.52 0.03 350)",
      accent: "oklch(0.94 0.025 350)",
      accentForeground: "oklch(0.32 0.03 350)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.02 350)",
      input: "oklch(0.90 0.015 350)",
      ring: "oklch(0.52 0.12 350)",
      chart1: "oklch(0.52 0.15 350)",
      chart2: "oklch(0.58 0.12 330)",
      chart3: "oklch(0.50 0.10 10)",
      chart4: "oklch(0.55 0.12 310)",
      chart5: "oklch(0.48 0.10 30)",
    },
    dark: {
      primary: "oklch(0.68 0.15 350)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.10 150)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.12 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.10 320)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.62 0.15 350)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 350)",
      sidebar: "oklch(0.16 0.02 350)",
      sidebarAccent: "oklch(0.26 0.03 350)",
      sidebarAccentForeground: "oklch(0.92 0.02 350)",
      sidebarBorder: "oklch(0.32 0.02 350)",
      sidebarRing: "oklch(0.62 0.12 350)",
      background: "oklch(0.15 0.015 350)",
      foreground: "oklch(0.88 0.02 350)",
      card: "oklch(0.19 0.02 350)",
      cardForeground: "oklch(0.88 0.02 350)",
      popover: "oklch(0.19 0.02 350)",
      popoverForeground: "oklch(0.88 0.02 350)",
      secondary: "oklch(0.24 0.02 350)",
      secondaryForeground: "oklch(0.78 0.02 350)",
      muted: "oklch(0.28 0.02 350)",
      mutedForeground: "oklch(0.68 0.02 350)",
      accent: "oklch(0.28 0.03 350)",
      accentForeground: "oklch(0.90 0.02 350)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.32 0.02 350)",
      input: "oklch(0.30 0.025 350)",
      ring: "oklch(0.62 0.12 350)",
      chart1: "oklch(0.62 0.15 350)",
      chart2: "oklch(0.65 0.12 330)",
      chart3: "oklch(0.58 0.10 10)",
      chart4: "oklch(0.60 0.12 310)",
      chart5: "oklch(0.55 0.10 30)",
    },
  },
  {
    id: "slate",
    name: "Ardósia",
    description: "Tons sofisticados de cinza escuro",
    preview: {
      primary: "#455a64",
      secondary: "#eceff1",
      accent: "#607d8b",
    },
    light: {
      primary: "oklch(0.42 0.04 220)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.08 150)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.10 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.06 220)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.38 0.04 220)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.30 0.02 220)",
      sidebar: "oklch(0.97 0.005 220)",
      sidebarAccent: "oklch(0.92 0.01 220)",
      sidebarAccentForeground: "oklch(0.26 0.02 220)",
      sidebarBorder: "oklch(0.88 0.008 220)",
      sidebarRing: "oklch(0.48 0.05 220)",
      background: "oklch(0.98 0.003 220)",
      foreground: "oklch(0.26 0.02 220)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.26 0.02 220)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.26 0.02 220)",
      secondary: "oklch(0.94 0.008 220)",
      secondaryForeground: "oklch(0.36 0.02 220)",
      muted: "oklch(0.95 0.006 220)",
      mutedForeground: "oklch(0.50 0.02 220)",
      accent: "oklch(0.93 0.01 220)",
      accentForeground: "oklch(0.30 0.02 220)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.008 220)",
      input: "oklch(0.90 0.006 220)",
      ring: "oklch(0.48 0.05 220)",
      chart1: "oklch(0.42 0.04 220)",
      chart2: "oklch(0.50 0.05 200)",
      chart3: "oklch(0.48 0.04 240)",
      chart4: "oklch(0.45 0.05 180)",
      chart5: "oklch(0.52 0.04 260)",
    },
    dark: {
      primary: "oklch(0.58 0.05 220)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.08 150)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.10 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.06 220)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.52 0.05 220)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.82 0.015 220)",
      sidebar: "oklch(0.16 0.015 220)",
      sidebarAccent: "oklch(0.24 0.02 220)",
      sidebarAccentForeground: "oklch(0.90 0.01 220)",
      sidebarBorder: "oklch(0.30 0.015 220)",
      sidebarRing: "oklch(0.52 0.05 220)",
      background: "oklch(0.14 0.01 220)",
      foreground: "oklch(0.86 0.015 220)",
      card: "oklch(0.18 0.015 220)",
      cardForeground: "oklch(0.86 0.015 220)",
      popover: "oklch(0.18 0.015 220)",
      popoverForeground: "oklch(0.86 0.015 220)",
      secondary: "oklch(0.22 0.015 220)",
      secondaryForeground: "oklch(0.76 0.015 220)",
      muted: "oklch(0.26 0.015 220)",
      mutedForeground: "oklch(0.66 0.015 220)",
      accent: "oklch(0.26 0.02 220)",
      accentForeground: "oklch(0.88 0.015 220)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.30 0.015 220)",
      input: "oklch(0.28 0.02 220)",
      ring: "oklch(0.52 0.05 220)",
      chart1: "oklch(0.52 0.05 220)",
      chart2: "oklch(0.58 0.05 200)",
      chart3: "oklch(0.55 0.04 240)",
      chart4: "oklch(0.52 0.05 180)",
      chart5: "oklch(0.60 0.04 260)",
    },
  },
  {
    id: "teal",
    name: "Turquesa",
    description: "Tons vibrantes de azul-esverdeado",
    preview: {
      primary: "#00796b",
      secondary: "#e0f2f1",
      accent: "#009688",
    },
    light: {
      primary: "oklch(0.50 0.10 180)",
      primaryForeground: "oklch(0.98 0 0)",
      success: "oklch(0.55 0.10 160)",
      successForeground: "oklch(0.98 0 0)",
      warning: "oklch(0.65 0.12 80)",
      warningForeground: "oklch(0.20 0 0)",
      info: "oklch(0.52 0.10 190)",
      infoForeground: "oklch(0.98 0 0)",
      sidebarPrimary: "oklch(0.45 0.10 180)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.30 0.03 180)",
      sidebar: "oklch(0.97 0.015 180)",
      sidebarAccent: "oklch(0.92 0.025 180)",
      sidebarAccentForeground: "oklch(0.26 0.03 180)",
      sidebarBorder: "oklch(0.88 0.02 180)",
      sidebarRing: "oklch(0.52 0.10 180)",
      background: "oklch(0.98 0.008 180)",
      foreground: "oklch(0.26 0.03 180)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.26 0.03 180)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.26 0.03 180)",
      secondary: "oklch(0.94 0.02 180)",
      secondaryForeground: "oklch(0.36 0.03 180)",
      muted: "oklch(0.95 0.015 180)",
      mutedForeground: "oklch(0.50 0.03 180)",
      accent: "oklch(0.93 0.025 180)",
      accentForeground: "oklch(0.30 0.03 180)",
      destructive: "oklch(0.50 0.15 20)",
      destructiveForeground: "oklch(0.98 0 0)",
      border: "oklch(0.88 0.02 180)",
      input: "oklch(0.90 0.015 180)",
      ring: "oklch(0.52 0.10 180)",
      chart1: "oklch(0.50 0.10 180)",
      chart2: "oklch(0.55 0.08 160)",
      chart3: "oklch(0.48 0.08 200)",
      chart4: "oklch(0.52 0.10 140)",
      chart5: "oklch(0.50 0.08 220)",
    },
    dark: {
      primary: "oklch(0.65 0.10 180)",
      primaryForeground: "oklch(0.12 0 0)",
      success: "oklch(0.62 0.10 160)",
      successForeground: "oklch(0.12 0 0)",
      warning: "oklch(0.70 0.12 80)",
      warningForeground: "oklch(0.12 0 0)",
      info: "oklch(0.62 0.10 190)",
      infoForeground: "oklch(0.12 0 0)",
      sidebarPrimary: "oklch(0.58 0.10 180)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarForeground: "oklch(0.85 0.02 180)",
      sidebar: "oklch(0.15 0.02 180)",
      sidebarAccent: "oklch(0.25 0.03 180)",
      sidebarAccentForeground: "oklch(0.92 0.02 180)",
      sidebarBorder: "oklch(0.30 0.02 180)",
      sidebarRing: "oklch(0.58 0.10 180)",
      background: "oklch(0.14 0.015 180)",
      foreground: "oklch(0.88 0.02 180)",
      card: "oklch(0.18 0.02 180)",
      cardForeground: "oklch(0.88 0.02 180)",
      popover: "oklch(0.18 0.02 180)",
      popoverForeground: "oklch(0.88 0.02 180)",
      secondary: "oklch(0.22 0.02 180)",
      secondaryForeground: "oklch(0.78 0.02 180)",
      muted: "oklch(0.26 0.02 180)",
      mutedForeground: "oklch(0.68 0.02 180)",
      accent: "oklch(0.26 0.025 180)",
      accentForeground: "oklch(0.90 0.02 180)",
      destructive: "oklch(0.55 0.15 20)",
      destructiveForeground: "oklch(0.95 0 0)",
      border: "oklch(0.30 0.02 180)",
      input: "oklch(0.28 0.025 180)",
      ring: "oklch(0.58 0.10 180)",
      chart1: "oklch(0.58 0.10 180)",
      chart2: "oklch(0.62 0.08 160)",
      chart3: "oklch(0.55 0.08 200)",
      chart4: "oklch(0.60 0.10 140)",
      chart5: "oklch(0.55 0.08 220)",
    },
  },
];

/**
 * Aplica um tema ao documento
 */
export function applyTheme(themeId: string, mode: "light" | "dark"): void {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  
  const colors = mode === "dark" ? theme.dark : theme.light;
  const root = document.documentElement;
  
  // Aplicar todas as variáveis CSS
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryForeground);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--success-foreground", colors.successForeground);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--warning-foreground", colors.warningForeground);
  root.style.setProperty("--info", colors.info);
  root.style.setProperty("--info-foreground", colors.infoForeground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
  root.style.setProperty("--sidebar", colors.sidebar);
  root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", colors.sidebarBorder);
  root.style.setProperty("--sidebar-ring", colors.sidebarRing);
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.cardForeground);
  root.style.setProperty("--popover", colors.popover);
  root.style.setProperty("--popover-foreground", colors.popoverForeground);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--muted-foreground", colors.mutedForeground);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.accentForeground);
  root.style.setProperty("--destructive", colors.destructive);
  root.style.setProperty("--destructive-foreground", colors.destructiveForeground);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.input);
  root.style.setProperty("--ring", colors.ring);
  root.style.setProperty("--chart-1", colors.chart1);
  root.style.setProperty("--chart-2", colors.chart2);
  root.style.setProperty("--chart-3", colors.chart3);
  root.style.setProperty("--chart-4", colors.chart4);
  root.style.setProperty("--chart-5", colors.chart5);
}

/**
 * Remove as variáveis de tema customizadas (volta ao padrão do CSS)
 */
export function resetTheme(): void {
  const root = document.documentElement;
  const properties = [
    "--primary", "--primary-foreground",
    "--success", "--success-foreground",
    "--warning", "--warning-foreground",
    "--info", "--info-foreground",
    "--sidebar-primary", "--sidebar-primary-foreground",
    "--sidebar-foreground", "--sidebar",
    "--sidebar-accent", "--sidebar-accent-foreground",
    "--sidebar-border", "--sidebar-ring",
    "--background", "--foreground",
    "--card", "--card-foreground",
    "--popover", "--popover-foreground",
    "--secondary", "--secondary-foreground",
    "--muted", "--muted-foreground",
    "--accent", "--accent-foreground",
    "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring",
    "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
  ];
  
  properties.forEach(prop => root.style.removeProperty(prop));
}

/**
 * Obtém o tema atual salvo no localStorage
 */
export function getSavedColorTheme(): string {
  return localStorage.getItem("color-theme") || "default";
}

/**
 * Salva o tema no localStorage
 */
export function saveColorTheme(themeId: string): void {
  localStorage.setItem("color-theme", themeId);
}
