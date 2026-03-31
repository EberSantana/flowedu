import React from "react";
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

export function MotivationalBanner({
  greeting,
  avatarInitial,
  variant = "professor",
  isCustomizing,
  onCustomize,
  onReset,
}: MotivationalBannerProps) {
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
        background: "linear-gradient(135deg, oklch(32% .14 145) 0%, oklch(42% .14 145) 40%, oklch(55% .10 145) 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Círculos decorativos de fundo */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 rounded-full opacity-10"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-2.5rem] right-20 h-40 w-40 rounded-full opacity-[0.06]"
        style={{ background: "hsl(var(--primary))" }}
      />
      {/* Linha de brilho superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
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
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl" style={{color: "rgba(255,255,255,0.95)"}}>
                {greeting.greeting} {greeting.emoji}
              </h1>
              <p className="mt-1 max-w-lg text-sm leading-relaxed" style={{color: "rgba(255,255,255,0.85)"}}>
                {greeting.message}
              </p>
            </div>
          </div>

          {/* Data + botão Personalizar (empilhados) */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{color: "rgba(255,255,255,0.75)"}}>
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
                    background: isCustomizing
                      ? "hsl(var(--primary) / 0.35)"
                      : "hsl(var(--primary) / 0.18)",
                    color: "hsl(var(--primary))",
                    border: isCustomizing
                      ? "1px solid hsl(var(--primary) / 0.7)"
                      : "1px solid hsl(var(--primary) / 0.35)",
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
                        background: "hsl(var(--primary) / 0.22)",
                        border: "1px solid hsl(var(--primary) / 0.5)",
                        color: "hsl(var(--primary))",
                      }
                    : {
                        background: "rgba(255,255,255,0.35)",
                        border: "1px solid rgba(0,0,0,0.20)",
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
            borderTop: "1px solid rgba(0,0,0,0.15)",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          💬 {greeting.frase}
        </div>
      </div>
    </div>
  );
}
