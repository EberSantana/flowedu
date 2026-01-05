import React, { useEffect, useState } from "react";
import { HD2D_CHARACTERS, getCharacterById } from "../../../shared/hd2d-characters";
import { cn } from "@/lib/utils";

interface HD2DAvatarDisplayProps {
  characterId: number;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  showTitle?: boolean;
  showAura?: boolean;
  showParticles?: boolean;
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Componente de exibição de avatar HD-2D (Octopath Traveler II Style)
 * 
 * Características:
 * - Pixel art de alta definição
 * - Iluminação volumétrica
 * - Partículas dinâmicas
 * - Animações idle sutis
 * - Aura colorida por personagem
 */
export function HD2DAvatarDisplay({
  characterId,
  size = "md",
  showName = false,
  showTitle = false,
  showAura = true,
  showParticles = true,
  animate = true,
  className,
  onClick,
}: HD2DAvatarDisplayProps) {
  const character = getCharacterById(characterId);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Tamanhos do avatar
  const sizeClasses = {
    sm: "w-24 h-32",
    md: "w-32 h-40",
    lg: "w-48 h-60",
    xl: "w-64 h-80",
  };

  const imageSizes = {
    sm: "w-20 h-28",
    md: "w-28 h-36",
    lg: "w-44 h-56",
    xl: "w-60 h-76",
  };

  // Gerar partículas aleatórias
  useEffect(() => {
    if (!showParticles) return;

    const generateParticles = () => {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
      }));
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 5000);

    return () => clearInterval(interval);
  }, [showParticles]);

  if (!character) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg", sizeClasses[size], className)}>
        <span className="text-muted-foreground text-sm">Personagem não encontrado</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container do Avatar com Aura */}
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Aura de fundo (glow effect) */}
        {showAura && (
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500",
              animate && "animate-pulse",
              isHovered && "opacity-60"
            )}
            style={{
              background: `radial-gradient(circle, ${character.auraColor}40 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Partículas flutuantes */}
        {showParticles && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 rounded-full animate-float-particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  backgroundColor: character.auraColor,
                  animationDelay: `${particle.delay}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Imagem do personagem */}
        <div className="relative z-10">
          <img
            src={character.imagePath}
            alt={character.name}
            className={cn(
              "object-contain drop-shadow-2xl transition-transform duration-300",
              imageSizes[size],
              animate && "animate-idle-breathing",
              isHovered && "scale-105"
            )}
            style={{
              imageRendering: "pixelated",
              filter: isHovered ? "brightness(1.1)" : "brightness(1)",
            }}
          />

          {/* Brilho adicional no hover */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
              style={{
                background: `radial-gradient(circle, ${character.auraColor} 0%, transparent 60%)`,
              }}
            />
          )}
        </div>

        {/* Sombra suave */}
        <div
          className="absolute bottom-0 w-3/4 h-2 rounded-full blur-md opacity-30"
          style={{
            background: `radial-gradient(ellipse, ${character.auraColor}80 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Nome do personagem */}
      {showName && (
        <div className="mt-2 text-center">
          <p
            className={cn(
              "font-bold tracking-wide",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg"
            )}
            style={{ color: character.auraColor }}
          >
            {character.name}
          </p>
        </div>
      )}

      {/* Título do personagem */}
      {showTitle && (
        <div className="mt-1 text-center">
          <p
            className={cn(
              "text-muted-foreground italic",
              size === "sm" && "text-xs",
              size === "md" && "text-xs",
              size === "lg" && "text-sm",
              size === "xl" && "text-base"
            )}
          >
            {character.title}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de galeria de personagens HD-2D
 */
interface HD2DAvatarGalleryProps {
  unlockedCharacters: number[];
  currentCharacterId: number;
  totalPoints: number;
  onSelectCharacter: (characterId: number) => void;
  className?: string;
}

export function HD2DAvatarGallery({
  unlockedCharacters,
  currentCharacterId,
  totalPoints,
  onSelectCharacter,
  className,
}: HD2DAvatarGalleryProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-6", className)}>
      {HD2D_CHARACTERS.map((character) => {
        const isUnlocked = unlockedCharacters.includes(character.id);
        const isCurrent = character.id === currentCharacterId;
        const canUnlock = totalPoints >= character.unlockPoints;

        return (
          <div
            key={character.id}
            className={cn(
              "relative rounded-xl border-2 p-4 transition-all duration-300",
              isCurrent && "border-primary ring-4 ring-primary/20",
              isUnlocked && !isCurrent && "border-border hover:border-primary/50 cursor-pointer",
              !isUnlocked && "border-muted bg-muted/50 opacity-50"
            )}
            onClick={() => isUnlocked && onSelectCharacter(character.id)}
          >
            {/* Badge de personagem atual */}
            {isCurrent && (
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
                Ativo
              </div>
            )}

            {/* Badge de bloqueado */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-sm font-semibold">Nível {character.unlockLevel}</p>
                  <p className="text-xs text-muted-foreground">{character.unlockPoints} pontos</p>
                  {canUnlock && (
                    <p className="text-xs text-primary font-bold mt-1">Disponível!</p>
                  )}
                </div>
              </div>
            )}

            {/* Avatar */}
            <HD2DAvatarDisplay
              characterId={character.id}
              size="md"
              showName
              showTitle
              showAura={isUnlocked}
              showParticles={isUnlocked}
              animate={isUnlocked}
            />

            {/* Informações */}
            {isUnlocked && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Personalidade:</span>
                  <span className="font-medium">{character.personality}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Habilidade:</span>
                  <span className="font-medium">{character.specialAbility}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
