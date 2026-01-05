import React, { useEffect, useState } from "react";
import { HD2DAvatarDisplay } from "./HD2DAvatarDisplay";
import { getCharacterById } from "../../../shared/hd2d-characters";
import { Button } from "./ui/button";
import { X, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface HD2DUnlockNotificationProps {
  characterId: number;
  onClose: () => void;
}

/**
 * Notificação animada de desbloqueio de personagem HD-2D
 * Inspirado no estilo Octopath Traveler II
 */
export function HD2DUnlockNotification({
  characterId,
  onClose,
}: HD2DUnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const character = getCharacterById(characterId);

  useEffect(() => {
    // Animação de entrada
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!character) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Overlay com blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card de notificação */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl border-4 border-yellow-400 overflow-hidden max-w-2xl w-full transition-all duration-500",
          isVisible ? "scale-100 rotate-0" : "scale-50 rotate-12"
        )}
        style={{
          boxShadow: "0 0 60px rgba(251, 191, 36, 0.5), 0 0 100px rgba(147, 51, 234, 0.3)",
        }}
      >
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Partículas douradas */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Raios de luz */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-400/10 to-transparent animate-pulse" />
        </div>

        {/* Botão de fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Conteúdo */}
        <div className="relative p-8 md:p-12">
          {/* Título */}
          <div
            className={cn(
              "text-center mb-8 transition-all duration-500 delay-200",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
            )}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
                Novo Personagem!
              </h2>
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
            </div>
            <p className="text-xl text-yellow-200 font-semibold">
              Você desbloqueou um novo herói HD-2D!
            </p>
          </div>

          {/* Avatar do personagem */}
          <div
            className={cn(
              "flex justify-center mb-8 transition-all duration-700 delay-400",
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <div className="relative">
              {/* Círculo de energia */}
              <div
                className="absolute inset-0 -m-8 rounded-full blur-2xl animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${character.auraColor}80 0%, transparent 70%)`,
                }}
              />

              {/* Avatar */}
              <div className="relative animate-unlock-burst">
                <HD2DAvatarDisplay
                  characterId={characterId}
                  size="xl"
                  showAura
                  showParticles
                  animate
                />
              </div>

              {/* Estrelas girando */}
              <div className="absolute inset-0 -m-12 animate-energy-circle">
                <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="absolute inset-0 -m-12 animate-energy-circle" style={{ animationDelay: "2s" }}>
                <Sparkles className="w-6 h-6 text-purple-400 fill-purple-400" />
              </div>
            </div>
          </div>

          {/* Informações do personagem */}
          <div
            className={cn(
              "bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transition-all duration-700 delay-600",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
          >
            <h3
              className="text-3xl font-bold text-center mb-2"
              style={{ color: character.auraColor }}
            >
              {character.name}
            </h3>
            <p className="text-xl text-yellow-200 text-center italic mb-4">
              {character.title}
            </p>
            <p className="text-white/90 text-center leading-relaxed mb-6">
              {character.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/60 mb-1">Personalidade</p>
                <p className="text-white font-semibold">{character.personality}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white/60 mb-1">Habilidade</p>
                <p className="text-white font-semibold">{character.specialAbility}</p>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Incrível! Vamos lá!
            </Button>
          </div>
        </div>

        {/* Borda animada */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-yellow-400 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
