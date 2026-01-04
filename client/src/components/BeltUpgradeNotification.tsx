import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { KarateAvatar, BeltColor } from '@/components/KarateAvatar';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { CelebrationAnimation } from './CelebrationAnimation';

interface BeltUpgradeNotificationProps {
  oldBelt: BeltColor;
  newBelt: BeltColor;
  totalPoints: number;
  onClose: () => void;
}

const BELT_NAMES: Record<BeltColor, string> = {
  white: 'Branca',
  yellow: 'Amarela',
  orange: 'Laranja',
  green: 'Verde',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
};

const BELT_EMOJIS: Record<BeltColor, string> = {
  white: '⚪',
  yellow: '🟡',
  orange: '🟠',
  green: '🟢',
  blue: '🔵',
  purple: '🟣',
  brown: '🟤',
  black: '⚫',
};

export function BeltUpgradeNotification({
  oldBelt,
  newBelt,
  totalPoints,
  onClose,
}: BeltUpgradeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const isBlackBelt = newBelt === 'black';

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setShowCelebration(true), 500);

    // Auto-fechar após 8 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <>
      {/* Overlay escuro */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Card de notificação */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
      >
        <Card
          className={`
            pointer-events-auto max-w-lg w-full
            border-4 shadow-2xl
            transition-all duration-700 transform
            ${isVisible ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-12'}
            ${isBlackBelt 
              ? 'border-yellow-400 bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
              : 'border-orange-400 bg-gradient-to-br from-orange-50 via-yellow-50 to-white'
            }
          `}
        >
          <CardContent className="p-8 relative overflow-hidden">
            {/* Animação de celebração */}
            <CelebrationAnimation
              isActive={showCelebration}
              type={isBlackBelt ? 'blackbelt' : 'levelup'}
              onComplete={() => setShowCelebration(false)}
            />

            {/* Ícone de troféu com animação aprimorada */}
            <div className="flex justify-center mb-4">
              {isBlackBelt ? (
                <div className="relative animate-bounce">
                  <Trophy className="h-16 w-16 text-yellow-400" />
                  <Sparkles className="h-8 w-8 text-yellow-300 absolute -top-2 -right-2 animate-spin" />
                </div>
              ) : (
                <Star className="h-16 w-16 text-orange-500 animate-pulse" />
              )}
            </div>

            {/* Título */}
            <h2
              className={`
                text-3xl font-bold text-center mb-2
                ${isBlackBelt ? 'text-yellow-400' : 'text-orange-600'}
              `}
            >
              {isBlackBelt ? '🥋 FAIXA PRETA CONQUISTADA! 🥋' : '🎉 Parabéns! Nova Faixa! 🎉'}
            </h2>

            {/* Mensagem */}
            <p
              className={`
                text-center mb-6 text-lg
                ${isBlackBelt ? 'text-gray-200' : 'text-gray-700'}
              `}
            >
              {isBlackBelt
                ? 'Você alcançou o nível máximo de maestria!'
                : 'Continue assim e alcance novos patamares!'}
            </p>

            {/* Comparação de faixas */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* Faixa antiga */}
              <div className="text-center">
                <div className="mb-2">
                  <KarateAvatar belt={oldBelt} size="md" />
                </div>
                <p className={`text-sm font-medium ${isBlackBelt ? 'text-gray-400' : 'text-gray-500'}`}>
                  {BELT_EMOJIS[oldBelt]} {BELT_NAMES[oldBelt]}
                </p>
              </div>

              {/* Seta */}
              <div className="text-4xl animate-pulse">→</div>

              {/* Faixa nova */}
              <div className="text-center">
                <div className="mb-2 relative">
                  <KarateAvatar belt={newBelt} size="md" />
                  {isBlackBelt && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
                    </div>
                  )}
                </div>
                <p
                  className={`
                    text-sm font-bold
                    ${isBlackBelt ? 'text-yellow-400' : 'text-orange-600'}
                  `}
                >
                  {BELT_EMOJIS[newBelt]} {BELT_NAMES[newBelt]}
                </p>
              </div>
            </div>

            {/* Pontos totais */}
            <div
              className={`
                text-center p-4 rounded-lg
                ${isBlackBelt 
                  ? 'bg-yellow-400/20 border-2 border-yellow-400' 
                  : 'bg-orange-100 border-2 border-orange-300'
                }
              `}
            >
              <p className={`text-sm ${isBlackBelt ? 'text-gray-300' : 'text-gray-600'}`}>
                Pontos Totais
              </p>
              <p
                className={`
                  text-3xl font-bold
                  ${isBlackBelt ? 'text-yellow-400' : 'text-orange-600'}
                `}
              >
                {totalPoints.toLocaleString()} pts
              </p>
            </div>

            {/* Mensagem especial para faixa preta */}
            {isBlackBelt && (
              <div className="mt-6 text-center">
                <p className="text-yellow-400 font-semibold text-lg animate-pulse">
                  ⭐ Você é um Mestre do Karatê! ⭐
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  Continue praticando para manter sua excelência!
                </p>
              </div>
            )}

            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className={`
                mt-6 w-full py-3 rounded-lg font-semibold text-lg
                transition-all duration-200 transform hover:scale-105
                ${isBlackBelt
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                  : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600'
                }
              `}
            >
              Continuar Treinando! 🥋
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Estilos de animação */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </>
  );
}
