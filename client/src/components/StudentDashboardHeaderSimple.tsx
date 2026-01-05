import { MinimalKarateAvatar, getBeltName, BELT_CONFIG, type BeltColor } from "./MinimalKarateAvatar";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp } from "lucide-react";

interface StudentDashboardHeaderSimpleProps {
  studentName: string;
  currentBelt: BeltColor;
  totalPoints: number;
  nextBeltThreshold: number;
}

export function StudentDashboardHeaderSimple({
  studentName,
  currentBelt,
  totalPoints,
  nextBeltThreshold,
}: StudentDashboardHeaderSimpleProps) {
  // Calcular progresso
  const currentBeltConfig = BELT_CONFIG.find(b => b.name === currentBelt);
  const currentBeltMin = currentBeltConfig?.minPoints || 0;
  const progressPercent = currentBelt === 'black' 
    ? 100 
    : Math.min(100, ((totalPoints - currentBeltMin) / (nextBeltThreshold - currentBeltMin)) * 100);
  const pointsToNext = Math.max(0, nextBeltThreshold - totalPoints);

  // Saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
              <MinimalKarateAvatar belt={currentBelt} size="lg" />
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Saudação */}
            <div>
              <p className="text-gray-500 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{studentName}</h1>
            </div>

            {/* Faixa e Pontos */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div 
                className="px-4 py-2 rounded-full font-semibold text-sm border-2"
                style={{ 
                  backgroundColor: `${currentBeltConfig?.color}15`,
                  borderColor: currentBeltConfig?.color,
                  color: currentBelt === 'white' ? '#374151' : currentBeltConfig?.color
                }}
              >
                Faixa {currentBeltConfig?.label}
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-600">{totalPoints}</span>
                <span className="text-sm text-blue-500">Tech Coins</span>
              </div>
            </div>

            {/* Progresso para próxima faixa */}
            {currentBelt !== 'black' && (
              <div className="max-w-md">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Próxima faixa
                  </span>
                  <span>{pointsToNext} Tech Coins restantes</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {currentBelt === 'black' && (
              <p className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full inline-block border border-yellow-200">
                🏆 Mestre - Faixa Preta conquistada!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardHeaderSimple;
