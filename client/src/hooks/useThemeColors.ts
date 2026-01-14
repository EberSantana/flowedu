import { useTheme } from "@/contexts/ThemeContext";

/**
 * Hook para obter cores dinâmicas baseadas no tema ativo.
 * Retorna classes CSS que se adaptam automaticamente ao tema selecionado.
 */
export function useThemeColors() {
  const { theme, effectiveTheme } = useTheme();
  
  // Classes CSS dinâmicas baseadas no tema
  // Usam as variáveis CSS do tema ativo
  return {
    // Cores primárias
    primary: {
      bg: "bg-primary",
      bgHover: "hover:bg-primary/90",
      bgLight: "bg-primary/10",
      bgLighter: "bg-primary/5",
      text: "text-primary",
      textForeground: "text-primary-foreground",
      border: "border-primary",
      borderLight: "border-primary/30",
      gradient: "from-primary to-primary/80",
      gradientHover: "hover:from-primary/90 hover:to-primary/70",
    },
    
    // Cores de sucesso (verde)
    success: {
      bg: "bg-success",
      bgHover: "hover:bg-success/90",
      bgLight: "bg-success/10",
      bgLighter: "bg-success/5",
      text: "text-success",
      textForeground: "text-success-foreground",
      border: "border-success",
      borderLight: "border-success/30",
      gradient: "from-success to-success/80",
    },
    
    // Cores de aviso (amarelo/laranja)
    warning: {
      bg: "bg-warning",
      bgHover: "hover:bg-warning/90",
      bgLight: "bg-warning/10",
      bgLighter: "bg-warning/5",
      text: "text-warning",
      textForeground: "text-warning-foreground",
      border: "border-warning",
      borderLight: "border-warning/30",
      gradient: "from-warning to-warning/80",
    },
    
    // Cores de informação (azul)
    info: {
      bg: "bg-info",
      bgHover: "hover:bg-info/90",
      bgLight: "bg-info/10",
      bgLighter: "bg-info/5",
      text: "text-info",
      textForeground: "text-info-foreground",
      border: "border-info",
      borderLight: "border-info/30",
      gradient: "from-info to-info/80",
    },
    
    // Cores destrutivas (vermelho)
    destructive: {
      bg: "bg-destructive",
      bgHover: "hover:bg-destructive/90",
      bgLight: "bg-destructive/10",
      bgLighter: "bg-destructive/5",
      text: "text-destructive",
      textForeground: "text-destructive-foreground",
      border: "border-destructive",
      borderLight: "border-destructive/30",
      gradient: "from-destructive to-destructive/80",
    },
    
    // Cores secundárias
    secondary: {
      bg: "bg-secondary",
      bgHover: "hover:bg-secondary/80",
      text: "text-secondary-foreground",
      border: "border-secondary",
    },
    
    // Cores de acento
    accent: {
      bg: "bg-accent",
      bgHover: "hover:bg-accent/80",
      text: "text-accent-foreground",
      border: "border-accent",
    },
    
    // Cores mutadas
    muted: {
      bg: "bg-muted",
      bgHover: "hover:bg-muted/80",
      text: "text-muted-foreground",
      border: "border-muted",
    },
    
    // Cores de gráficos
    chart: {
      color1: "var(--chart-1)",
      color2: "var(--chart-2)",
      color3: "var(--chart-3)",
      color4: "var(--chart-4)",
      color5: "var(--chart-5)",
    },
    
    // Helpers para cards de ação rápida
    quickAction: {
      // Variantes baseadas no tema
      variant1: {
        bg: "bg-gradient-to-br from-primary to-primary/80",
        hover: "hover:shadow-xl hover:scale-[1.02]",
        text: "text-primary-foreground",
      },
      variant2: {
        bg: "bg-gradient-to-br from-success to-success/80",
        hover: "hover:shadow-xl hover:scale-[1.02]",
        text: "text-success-foreground",
      },
      variant3: {
        bg: "bg-gradient-to-br from-info to-info/80",
        hover: "hover:shadow-xl hover:scale-[1.02]",
        text: "text-info-foreground",
      },
      variant4: {
        bg: "bg-gradient-to-br from-warning to-warning/80",
        hover: "hover:shadow-xl hover:scale-[1.02]",
        text: "text-warning-foreground",
      },
      variant5: {
        bg: "bg-gradient-to-br from-accent to-accent/80",
        hover: "hover:shadow-xl hover:scale-[1.02]",
        text: "text-accent-foreground",
      },
    },
    
    // Status de aulas
    classStatus: {
      given: {
        bg: "bg-success",
        bgHover: "hover:bg-success/90",
        text: "text-success-foreground",
        light: "bg-success/10",
        border: "border-success",
      },
      notGiven: {
        bg: "bg-warning",
        bgHover: "hover:bg-warning/90",
        text: "text-warning-foreground",
        light: "bg-warning/10",
        border: "border-warning",
      },
      cancelled: {
        bg: "bg-destructive",
        bgHover: "hover:bg-destructive/90",
        text: "text-destructive-foreground",
        light: "bg-destructive/10",
        border: "border-destructive",
      },
    },
    
    // Helpers gerais
    card: {
      base: "bg-card text-card-foreground",
      header: "bg-gradient-to-r from-primary/5 to-accent/5 border-b",
      headerAlt: "bg-gradient-to-r from-success/5 to-info/5 border-b",
    },
    
    // Tema atual
    currentTheme: theme,
    currentMode: effectiveTheme,
  };
}

/**
 * Mapeamento de cores antigas para novas classes do tema
 * Útil para migração gradual de componentes
 */
export const colorMigrationMap: Record<string, string> = {
  // Blues
  "from-blue-500 to-blue-600": "from-primary to-primary/80",
  "from-blue-500 to-blue-700": "from-primary to-primary/70",
  "bg-blue-500": "bg-primary",
  "bg-blue-600": "bg-primary",
  "bg-blue-100": "bg-primary/10",
  "bg-blue-50": "bg-primary/5",
  "text-blue-600": "text-primary",
  "text-blue-900": "text-primary",
  "border-blue-500": "border-primary",
  "border-blue-300": "border-primary/50",
  "hover:bg-blue-50": "hover:bg-primary/5",
  "hover:border-blue-300": "hover:border-primary/50",
  
  // Greens
  "from-green-500 to-green-600": "from-success to-success/80",
  "bg-green-500": "bg-success",
  "bg-green-600": "bg-success",
  "bg-green-100": "bg-success/10",
  "bg-green-50": "bg-success/5",
  "text-green-600": "text-success",
  "text-green-700": "text-success",
  "border-green-500": "border-success",
  "hover:bg-green-50": "hover:bg-success/5",
  "hover:bg-green-700": "hover:bg-success/90",
  "hover:border-green-500": "hover:border-success",
  "hover:text-green-700": "hover:text-success",
  
  // Reds
  "from-red-500 to-red-600": "from-destructive to-destructive/80",
  "bg-red-500": "bg-destructive",
  "bg-red-600": "bg-destructive",
  "bg-red-100": "bg-destructive/10",
  "bg-red-50": "bg-destructive/5",
  "text-red-600": "text-destructive",
  "text-red-700": "text-destructive",
  "border-red-500": "border-destructive",
  "border-red-300": "border-destructive/50",
  "hover:bg-red-50": "hover:bg-destructive/5",
  "hover:bg-red-700": "hover:bg-destructive/90",
  "hover:border-red-500": "hover:border-destructive",
  "hover:text-red-700": "hover:text-destructive",
  
  // Yellows/Warnings
  "from-yellow-500 to-yellow-600": "from-warning to-warning/80",
  "bg-yellow-500": "bg-warning",
  "bg-yellow-600": "bg-warning",
  "bg-yellow-100": "bg-warning/10",
  "bg-yellow-50": "bg-warning/5",
  "text-yellow-600": "text-warning",
  "text-yellow-900": "text-warning",
  "border-yellow-500": "border-warning",
  "hover:bg-yellow-50": "hover:bg-warning/5",
  "hover:bg-yellow-700": "hover:bg-warning/90",
  "hover:border-yellow-500": "hover:border-warning",
  "hover:text-yellow-700": "hover:text-warning",
  
  // Purples
  "from-purple-500 to-purple-600": "from-accent to-accent/80",
  "bg-purple-500": "bg-accent",
  "bg-purple-100": "bg-accent/10",
  "bg-purple-50": "bg-accent/5",
  
  // Teals
  "from-teal-500 to-teal-600": "from-info to-info/80",
  "bg-teal-500": "bg-info",
  "bg-teal-100": "bg-info/10",
  
  // Oranges
  "from-orange-500 to-orange-600": "from-warning to-warning/80",
  "bg-orange-500": "bg-warning",
  "bg-orange-100": "bg-warning/10",
  
  // Ambers
  "from-amber-50 via-orange-50 to-red-50": "from-warning/5 via-warning/10 to-destructive/5",
  "border-amber-200": "border-warning/30",
  "border-amber-300": "border-warning/50",
  "hover:bg-amber-50": "hover:bg-warning/5",
};

/**
 * Função helper para obter cores de gráfico compatíveis com Chart.js
 */
export function getChartColors(isDark: boolean = false) {
  // Retorna cores que funcionam bem com o tema atual
  const alpha = isDark ? "0.8" : "0.7";
  const alphaLight = isDark ? "0.2" : "0.1";
  
  return {
    primary: {
      main: `oklch(0.55 0.12 var(--chart-1-hue, 230) / ${alpha})`,
      light: `oklch(0.55 0.12 var(--chart-1-hue, 230) / ${alphaLight})`,
    },
    success: {
      main: `oklch(0.60 0.12 var(--chart-2-hue, 145) / ${alpha})`,
      light: `oklch(0.60 0.12 var(--chart-2-hue, 145) / ${alphaLight})`,
    },
    warning: {
      main: `oklch(0.70 0.12 var(--chart-3-hue, 80) / ${alpha})`,
      light: `oklch(0.70 0.12 var(--chart-3-hue, 80) / ${alphaLight})`,
    },
    info: {
      main: `oklch(0.58 0.10 var(--chart-4-hue, 200) / ${alpha})`,
      light: `oklch(0.58 0.10 var(--chart-4-hue, 200) / ${alphaLight})`,
    },
    accent: {
      main: `oklch(0.55 0.12 var(--chart-5-hue, 280) / ${alpha})`,
      light: `oklch(0.55 0.12 var(--chart-5-hue, 280) / ${alphaLight})`,
    },
  };
}
