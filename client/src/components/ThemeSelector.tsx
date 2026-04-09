import { useState, useEffect } from "react";
import { Check, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { themes, applyTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Funções de localStorage com chave por portal
function getLocalStorageKey(portal: "professor" | "student") {
  return portal === "student" ? "color-theme-student" : "color-theme";
}

function getSavedColorThemeForPortal(portal: "professor" | "student"): string {
  return localStorage.getItem(getLocalStorageKey(portal)) || "default";
}

function saveColorThemeForPortal(portal: "professor" | "student", themeId: string): void {
  localStorage.setItem(getLocalStorageKey(portal), themeId);
}

interface ThemeSelectorProps {
  trigger?: React.ReactNode;
  portal?: "professor" | "student";
}

export function ThemeSelector({ trigger, portal = "professor" }: ThemeSelectorProps) {
  const { theme: modeTheme, setTheme: setModeTheme, effectiveTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState(getSavedColorThemeForPortal(portal));
  const [open, setOpen] = useState(false);

  // Mutation e Query diferentes por portal
  const saveThemeProfessor = trpc.user.saveTheme.useMutation();
  const saveThemeStudent = trpc.student.saveTheme.useMutation();
  const saveThemeMutation = portal === "student" ? saveThemeStudent : saveThemeProfessor;

  const { data: professorThemeData } = trpc.user.getTheme.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: portal === "professor",
  });

  const { data: studentThemeData } = trpc.student.getTheme.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: portal === "student",
  });

  const savedThemeData = portal === "student" ? studentThemeData : professorThemeData;

  // Sincronizar tema do banco quando os dados chegarem
  useEffect(() => {
    if (!savedThemeData) return;
    if (savedThemeData.colorTheme && savedThemeData.colorTheme !== "default") {
      saveColorThemeForPortal(portal, savedThemeData.colorTheme);
      setColorTheme(savedThemeData.colorTheme);
      applyTheme(savedThemeData.colorTheme, effectiveTheme);
    }
    if (savedThemeData.themeMode && setModeTheme) {
      const localMode = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      if (!localMode || localMode === "system") {
        setModeTheme(savedThemeData.themeMode as "light" | "dark" | "system");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedThemeData]);

  // Aplicar tema ao carregar e quando mudar o modo (claro/escuro)
  useEffect(() => {
    const savedTheme = getSavedColorThemeForPortal(portal);
    if (savedTheme && savedTheme !== "default") {
      applyTheme(savedTheme, effectiveTheme);
    }
  }, [effectiveTheme, portal]);

  const handleColorThemeChange = (themeId: string) => {
    setColorTheme(themeId);
    saveColorThemeForPortal(portal, themeId);
    applyTheme(themeId, effectiveTheme);
    // Persistir no banco de dados
    saveThemeMutation.mutate({
      colorTheme: themeId,
      themeMode: modeTheme || "system",
    });
  };

  const handleModeChange = (mode: "light" | "dark" | "system") => {
    if (setModeTheme) {
      setModeTheme(mode);
      // Persistir modo no banco de dados
      saveThemeMutation.mutate({
        colorTheme: colorTheme || "default",
        themeMode: mode,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tema</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalizar Aparência
          </DialogTitle>
          <DialogDescription>
            Escolha o modo de exibição e a paleta de cores do sistema. Suas preferências são salvas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Modo de Exibição */}
          <div>
            <h3 className="text-sm font-medium mb-3">Modo de Exibição</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleModeChange("light")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  modeTheme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="w-16 h-12 rounded-md bg-white border shadow-sm flex items-center justify-center">
                  <Sun className="h-5 w-5 text-yellow-500" />
                </div>
                <span className="text-sm font-medium">Claro</span>
                {modeTheme === "light" && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>

              <button
                onClick={() => handleModeChange("dark")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  modeTheme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="w-16 h-12 rounded-md bg-gray-900 border border-gray-700 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-blue-300" />
                </div>
                <span className="text-sm font-medium">Escuro</span>
                {modeTheme === "dark" && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>

              <button
                onClick={() => handleModeChange("system")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  modeTheme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="w-16 h-12 rounded-md overflow-hidden border flex">
                  <div className="w-1/2 bg-white flex items-center justify-center">
                    <Sun className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="w-1/2 bg-gray-900 flex items-center justify-center">
                    <Moon className="h-4 w-4 text-blue-300" />
                  </div>
                </div>
                <span className="text-sm font-medium">Sistema</span>
                {modeTheme === "system" && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Paleta de Cores */}
          <div>
            <h3 className="text-sm font-medium mb-3">Paleta de Cores</h3>
            <div className="grid grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleColorThemeChange(theme.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    colorTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {/* Preview Visual */}
                  <div className="w-full aspect-[4/3] rounded-md overflow-hidden border relative">
                    {/* Fundo */}
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: theme.preview.secondary }}
                    />
                    {/* Sidebar simulada */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1/4"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    {/* Header simulado */}
                    <div 
                      className="absolute top-0 left-1/4 right-0 h-1/5"
                      style={{ backgroundColor: theme.preview.primary, opacity: 0.8 }}
                    />
                    {/* Cards simulados */}
                    <div className="absolute top-1/4 left-1/3 right-2 bottom-2 flex gap-1 p-1">
                      <div 
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: "white", opacity: 0.9 }}
                      />
                      <div 
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: "white", opacity: 0.9 }}
                      />
                    </div>
                    {/* Accent */}
                    <div 
                      className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    {/* Check se selecionado */}
                    {colorTheme === theme.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição do tema selecionado */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(() => {
                  const selectedTheme = themes.find(t => t.id === colorTheme);
                  if (!selectedTheme) return null;
                  return (
                    <>
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: selectedTheme.preview.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow -ml-2"
                        style={{ backgroundColor: selectedTheme.preview.accent }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow -ml-2"
                        style={{ backgroundColor: selectedTheme.preview.secondary }}
                      />
                    </>
                  );
                })()}
              </div>
              <div>
                <p className="font-medium">
                  {themes.find(t => t.id === colorTheme)?.name || "Padrão"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {themes.find(t => t.id === colorTheme)?.description || "Tema padrão do sistema"}
                </p>
              </div>
            </div>
            {saveThemeMutation.isSuccess && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Tema salvo com sucesso
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente compacto para uso na sidebar do professor
 */
export function ThemeSelectorCompact() {
  return (
    <ThemeSelector
      portal="professor"
      trigger={
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Personalizar tema</span>
        </Button>
      }
    />
  );
}
