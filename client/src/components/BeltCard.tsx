import { Award } from "lucide-react";

interface BeltCardProps {
  beltName: string;
  beltColor: string;
  totalPoints: number;
  progressPercent: number;
  pointsToNext: number;
  nextBeltName?: string;
}

export function BeltCard({
  beltName,
  beltColor,
  totalPoints,
  progressPercent,
  pointsToNext,
  nextBeltName
}: BeltCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
        Sua Jornada de Aprendizado
      </h2>

      {/* Card da Faixa Atual */}
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6 border-2 transition-all duration-300 hover:shadow-md"
        style={{ borderColor: beltColor }}
      >
        {/* Ícone da Faixa */}
        <div 
          className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: beltColor }}
        >
          <Award className="w-12 h-12 text-white" />
        </div>

        {/* Nome da Faixa */}
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {beltName}
        </h3>

        {/* Pontos Totais */}
        <p className="text-center text-gray-600 text-lg mb-4">
          {totalPoints} pontos
        </p>

        {/* Barra de Progresso */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progresso</span>
            <span className="text-sm font-bold text-gray-800">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: beltColor
              }}
            />
          </div>
        </div>

        {/* Informação da Próxima Faixa */}
        {nextBeltName && pointsToNext > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Faltam <span className="font-bold text-gray-800">{pointsToNext} pontos</span> para{" "}
              <span className="font-bold" style={{ color: beltColor }}>
                {nextBeltName}
              </span>
            </p>
          </div>
        )}

        {/* Faixa Preta Alcançada */}
        {!nextBeltName && (
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-gray-800">
              🎉 Você alcançou o nível máximo! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
