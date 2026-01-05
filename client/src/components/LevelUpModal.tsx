import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Belt3D } from './Belt3D';
import { cn } from '@/lib/utils';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldBelt: {
    name: string;
    displayName: string;
    level: number;
    color: string;
    icon: string;
  };
  newBelt: {
    name: string;
    displayName: string;
    level: number;
    color: string;
    icon: string;
  };
  totalPoints: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  oldBelt,
  newBelt,
  totalPoints
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNewBelt, setShowNewBelt] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Resetar estado
      setShowConfetti(false);
      setShowNewBelt(false);

      // Gerar confetes
      const colors = [newBelt.color, oldBelt.color, '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3'];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5
      }));
      setConfettiPieces(pieces);

      // Sequência de animação
      setTimeout(() => setShowConfetti(true), 100);
      setTimeout(() => setShowNewBelt(true), 800);
    }
  }, [isOpen, newBelt.color, oldBelt.color]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl p-0 overflow-hidden border-0 bg-transparent"
        style={{
          background: `radial-gradient(circle at center, ${newBelt.color}22 0%, transparent 70%)`
        }}
      >
        {/* Confetes */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                className="absolute w-3 h-3 animate-confetti-fall"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                  animationDelay: `${piece.delay}s`,
                  boxShadow: `0 0 10px ${piece.color}88`
                }}
              />
            ))}
          </div>
        )}

        {/* Fundo com gradiente animado */}
        <div 
          className="absolute inset-0 opacity-20 animate-pulse-slow"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${newBelt.color} 0%, transparent 70%)`
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 p-12 text-center space-y-8">
          {/* Título principal */}
          <div className="space-y-4">
            <h1 
              className="text-6xl font-black tracking-tight animate-scale-in"
              style={{
                background: `linear-gradient(135deg, ${newBelt.color} 0%, ${oldBelt.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: `0 0 40px ${newBelt.color}88`
              }}
            >
              LEVEL UP!
            </h1>
            <p className="text-2xl font-semibold text-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Você evoluiu para uma nova faixa!
            </p>
          </div>

          {/* Transição de faixas */}
          <div className="flex items-center justify-center gap-8 py-8">
            {/* Faixa antiga */}
            <div className={cn(
              'transition-all duration-1000',
              showNewBelt && 'opacity-50 scale-90'
            )}>
              <Belt3D
                beltName={oldBelt.name}
                beltColor={oldBelt.color}
                beltLevel={oldBelt.level}
                beltIcon={oldBelt.icon}
                displayName={oldBelt.displayName}
                size="lg"
                animated={false}
                interactive={false}
              />
            </div>

            {/* Seta de transição */}
            <div className="text-6xl animate-bounce-horizontal" style={{ animationDelay: '0.5s' }}>
              →
            </div>

            {/* Faixa nova */}
            <div className={cn(
              'transition-all duration-1000',
              showNewBelt ? 'opacity-100 scale-110' : 'opacity-0 scale-50'
            )}>
              <Belt3D
                beltName={newBelt.name}
                beltColor={newBelt.color}
                beltLevel={newBelt.level}
                beltIcon={newBelt.icon}
                displayName={newBelt.displayName}
                size="lg"
                animated={true}
                interactive={false}
              />
            </div>
          </div>

          {/* Estatísticas */}
          <div 
            className="flex items-center justify-center gap-8 animate-fade-in-up"
            style={{ animationDelay: '1s' }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Pontos Totais</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                Nível {newBelt.level}
              </div>
              <div className="text-sm text-muted-foreground">Novo Nível</div>
            </div>
          </div>

          {/* Mensagem motivacional */}
          <div 
            className="max-w-md mx-auto animate-fade-in-up"
            style={{ animationDelay: '1.2s' }}
          >
            <p className="text-lg text-muted-foreground">
              {getMotivationalMessage(newBelt.level)}
            </p>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={onClose}
            className={cn(
              'px-8 py-4 rounded-full font-bold text-lg',
              'transition-all duration-300 hover:scale-110',
              'animate-fade-in-up shadow-2xl'
            )}
            style={{
              background: `linear-gradient(135deg, ${newBelt.color} 0%, ${oldBelt.color} 100%)`,
              color: newBelt.color === '#FFFFFF' ? '#000000' : '#FFFFFF',
              boxShadow: `0 10px 40px ${newBelt.color}66`,
              animationDelay: '1.4s'
            }}
          >
            Continuar Jornada
          </button>
        </div>

        <style>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes fade-in-up {
            0% {
              transform: translateY(30px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes bounce-horizontal {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(20px);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.2;
            }
            50% {
              opacity: 0.4;
            }
          }

          .animate-confetti-fall {
            animation: confetti-fall 3s ease-in forwards;
          }

          .animate-scale-in {
            animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-bounce-horizontal {
            animation: bounce-horizontal 1s ease-in-out infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

function getMotivationalMessage(level: number): string {
  const messages = {
    2: "Seus primeiros passos foram dados com sucesso! Continue assim!",
    3: "Você está dominando o básico! O progresso é visível!",
    4: "Crescimento constante! Você está no caminho certo!",
    5: "Habilidades sólidas conquistadas! Você é avançado agora!",
    6: "Domínio técnico alcançado! Você é experiente!",
    7: "Excelência comprovada! Você é um mestre!",
    8: "Maestria absoluta! Você alcançou a Faixa Preta! 🏆"
  };
  
  return messages[level as keyof typeof messages] || "Parabéns pela sua evolução!";
}
