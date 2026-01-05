import { useState } from "react";
import { BeltTransitionAnimation } from "@/components/BeltTransitionAnimation";
import { BeltColor } from "@/components/KarateAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BELT_TRANSITIONS: Array<{ from: BeltColor; to: BeltColor; label: string }> = [
  { from: "white", to: "yellow", label: "Branca → Amarela" },
  { from: "yellow", to: "orange", label: "Amarela → Laranja" },
  { from: "orange", to: "green", label: "Laranja → Verde" },
  { from: "green", to: "blue", label: "Verde → Azul" },
  { from: "blue", to: "purple", label: "Azul → Roxa" },
  { from: "purple", to: "brown", label: "Roxa → Marrom" },
  { from: "brown", to: "black", label: "Marrom → Preta (Especial!)" },
];

export default function TestBeltTransitions() {
  const [activeTransition, setActiveTransition] = useState<{
    from: BeltColor;
    to: BeltColor;
  } | null>(null);

  const startTransition = (from: BeltColor, to: BeltColor) => {
    setActiveTransition({ from, to });
  };

  const closeTransition = () => {
    setActiveTransition(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            <CardTitle className="text-3xl font-bold text-center">
              🥋 Teste de Animações de Transição de Faixas
            </CardTitle>
            <p className="text-center text-white/90 mt-2">
              Clique em qualquer botão para visualizar a animação de morphing entre faixas
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {BELT_TRANSITIONS.map((transition, index) => (
                <Button
                  key={index}
                  onClick={() => startTransition(transition.from, transition.to)}
                  className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {transition.label}
                  {transition.to === "black" && " ⭐"}
                </Button>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ Sobre a Animação</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✨ <strong>Fase 1 (2s):</strong> Morphing suave de cores da faixa antiga para a nova</li>
                <li>🎉 <strong>Fase 2 (2s):</strong> Celebração com partículas, raios de luz e brilho</li>
                <li>✅ <strong>Fase 3 (1s):</strong> Mensagem de conquista e botão de continuar</li>
                <li>🥋 <strong>Especial:</strong> Faixa Preta tem animação lendária com efeitos dourados!</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-900 text-center">
                <strong>💡 Dica:</strong> Você pode fechar a animação clicando fora do modal ou no botão X
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animação Ativa */}
      {activeTransition && (
        <BeltTransitionAnimation
          oldBelt={activeTransition.from}
          newBelt={activeTransition.to}
          isActive={true}
          onComplete={closeTransition}
        />
      )}
    </div>
  );
}
