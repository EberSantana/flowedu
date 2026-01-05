import { useEffect } from "react";
import { trpc } from "../lib/trpc";
import { BeltCard } from "../components/BeltCard";
import { Loader2 } from "lucide-react";

export function TeacherBeltHome() {
  const { data: progressData, isLoading } = trpc.teacherBelt.getMyProgress.useQuery();

  useEffect(() => {
    document.title = "Início - Sistema de Gestão";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Erro ao carregar dados de progressão</p>
      </div>
    );
  }

  const { progress } = progressData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <BeltCard
          beltName={progress.currentBelt.name}
          beltColor={progress.currentBelt.displayColor}
          totalPoints={progressData.totalPoints}
          progressPercent={progress.progressPercent}
          pointsToNext={progress.pointsToNext}
          nextBeltName={progress.nextBelt?.name}
        />

        {/* Seção de Ações Rápidas */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/teacher-belt/add-activity"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Registrar Atividade
            </a>
            <a
              href="/teacher-belt/evolution"
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Ver Minha Evolução
            </a>
          </div>
        </div>

        {/* Informações sobre o Sistema de Faixas */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sobre o Sistema de Faixas</h3>
          <p className="text-gray-600 mb-4">
            O sistema de faixas reconhece seu desenvolvimento profissional através de 8 níveis,
            do iniciante (Faixa Branca) ao mestre (Faixa Preta).
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Branca", color: "#F5F5F5", points: 0 },
              { name: "Amarela", color: "#FCD34D", points: 100 },
              { name: "Laranja", color: "#FB923C", points: 250 },
              { name: "Verde", color: "#4ADE80", points: 500 },
              { name: "Azul", color: "#60A5FA", points: 1000 },
              { name: "Roxa", color: "#A78BFA", points: 2000 },
              { name: "Marrom", color: "#A16207", points: 4000 },
              { name: "Preta", color: "#1F2937", points: 8000 }
            ].map((belt) => (
              <div key={belt.name} className="text-center">
                <div
                  className="w-12 h-12 mx-auto rounded-full mb-2 border-2 border-gray-300"
                  style={{ backgroundColor: belt.color }}
                />
                <p className="text-xs font-semibold text-gray-700">{belt.name}</p>
                <p className="text-xs text-gray-500">{belt.points}pts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
