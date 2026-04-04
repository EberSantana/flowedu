import React, { useEffect, useState } from "react";
import { Settings, RotateCcw, Calendar } from "lucide-react";
import type { MotivationalGreeting } from "@/hooks/useMotivationalGreeting";

interface MotivationalBannerProps {
  greeting: MotivationalGreeting;
  avatarInitial: string;
  variant?: "professor" | "student";
  isCustomizing?: boolean;
  onCustomize?: () => void;
  onReset?: () => void;
}

/**
 * Lê o valor da variável CSS --primary do documento e extrai o hue OKLCH.
 * Retorna um gradient escuro baseado na cor primária do tema atual.
 */
function useBannerGradient() {
  const [gradient, setGradient] = useState<string>("");

  useEffect(() => {
    function buildGradient() {
      const root = document.documentElement;
      const primary = getComputedStyle(root).getPropertyValue("--primary").trim();

      // primary pode ser "oklch(0.45 0.12 230)", "oklch(42% .14 145)" ou "oklch(45% 12% 230)"
      // Extraímos lightness, chroma e hue para criar versões mais escuras
      const match = primary.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)%?\s+([\d.]+)\s*\)/);
      if (match) {
        // Normaliza: se for porcentagem (ex: 42%), divide por 100
        const rawL = parseFloat(match[1]);
        const rawC = parseFloat(match[2]);
        const l = rawL > 1 ? rawL / 100 : rawL;
        const c = rawC > 1 ? rawC / 100 : rawC;
        const h = parseFloat(match[3]);

        // Versões escuras da cor primária para o gradient
        const darkL = Math.max(0.18, l * 0.45);
        const midL  = Math.max(0.25, l * 0.60);
        const lightL = Math.max(0.32, l * 0.75);

        const start = `oklch(${darkL.toFixed(2)} ${c} ${h})`;
        const mid   = `oklch(${midL.toFixed(2)} ${c} ${h})`;
        const end   = `oklch(${lightL.toFixed(2)} ${(c * 0.85).toFixed(3)} ${h})`;

        setGradient(`linear-gradient(135deg, ${start} 0%, ${mid} 40%, ${end} 100%)`);
      } else {
        // Fallback: usa a cor primária diretamente com opacidade
        setGradient(`linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)`);
      }
    }

    buildGradient();

    // Observar mudanças no atributo style do html (quando o tema muda)
    const observer = new MutationObserver(buildGradient);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  return gradient;
}

export function MotivationalBanner({
  greeting,
  avatarInitial,
  variant = "professor",
  isCustomizing,
  onCustomize,
  onReset,
}: MotivationalBannerProps) {
  const gradient = useBannerGradient();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-8"
      style={{
        background: gradient || "var(--primary)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Círculos decorativos de fundo */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-2.5rem] right-20 h-40 w-40 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />
      {/* Linha de brilho superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
      />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Linha superior: avatar + nome + data + botão */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Avatar + saudação */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-bold"
              style={{
                background: "rgba(255,255,255,0.20)",
                border: "1.5px solid rgba(255,255,255,0.50)",
                color: "rgba(255,255,255,0.95)",
              }}
            >
              {avatarInitial}
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl" style={{ color: "rgba(255,255,255,0.95)" }}>
                {greeting.greeting} {greeting.emoji}
              </h1>
              <p className="mt-1 max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {greeting.message}
              </p>
            </div>
          </div>

          {/* Data + botão Personalizar (empilhados) */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
              <Calendar className="h-3.5 w-3.5" />
              <span>{todayFormatted}</span>
            </div>

            {onCustomize && (
              <div className="flex gap-2">
                {onReset && (
                  <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
                    style={{
                      background: "rgba(255,255,255,0.30)",
                      color: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(0,0,0,0.15)",
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar
                  </button>
                )}
                <button
                  onClick={onCustomize}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
                  style={{
                    background: isCustomizing ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.95)",
                    border: isCustomizing
                      ? "1px solid rgba(255,255,255,0.7)"
                      : "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  <Settings className="h-3 w-3" />
                  {isCustomizing ? "Concluir" : "Personalizar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chips de dados reais */}
        {greeting.chips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {greeting.chips.map((chip, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                style={
                  chip.highlight
                    ? {
                        background: "rgba(255,255,255,0.25)",
                        border: "1px solid rgba(255,255,255,0.5)",
                        color: "rgba(255,255,255,0.95)",
                      }
                    : {
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "rgba(255,255,255,0.85)",
                      }
                }
              >
                <span className="text-base leading-none">{chip.icon}</span>
                <span>{chip.value}</span>
                <span className="text-xs font-normal opacity-70">{chip.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Frase motivacional */}
        <div
          className="mt-5 pt-4 text-xs italic"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          💬 {greeting.frase}
        </div>
      </div>
    </div>
  );
}
