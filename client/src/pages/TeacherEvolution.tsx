import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { ArrowLeft, Award, Calendar, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export function TeacherEvolution() {
  
  const { data: beltHistory } = trpc.teacherBelt.getBeltHistory.useQuery();
  const { data: activitiesHistory } = trpc.teacherBelt.getActivitiesHistory.useQuery({ limit: 20 });
  const { data: stats } = trpc.teacherBelt.getActivityStats.useQuery();

  const ACTIVITY_LABELS: Record<string, string> = {
    class_taught: "Aula Ministrada",
    planning: "Planejamento",
    grading: "Correção",
    meeting: "Reunião",
    course_creation: "Plano de Curso",
    material_creation: "Material Didático",
    student_support: "Atendimento",
    professional_dev: "Desenvolvimento",
    other: "Outras"
  };

  const BELT_COLORS: Record<string, string> = {
    white: "#F5F5F5",
    yellow: "#FCD34D",
    orange: "#FB923C",
    green: "#4ADE80",
    blue: "#60A5FA",
    purple: "#A78BFA",
    brown: "#A16207",
    black: "#1F2937"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/teacher-belt">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Minha Evolução</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe seu progresso e conquistas profissionais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Histórico de Atividades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estatísticas Gerais */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Estatísticas
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalActivities}</p>
                    <p className="text-sm text-gray-600">Atividades</p>
                  </div>
                  {Object.entries(stats.byType).slice(0, 5).map(([type, data]) => (
                    <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{data.count}</p>
                      <p className="text-xs text-gray-600">{ACTIVITY_LABELS[type] || type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Atividades Recentes */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Atividades Recentes
              </h2>
              <div className="space-y-3">
                {activitiesHistory && activitiesHistory.length > 0 ? (
                  activitiesHistory.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-4 border-indigo-400 pl-4 py-2 bg-gray-50 rounded-r-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{activity.title}</p>
                          <p className="text-sm text-gray-600">
                            {ACTIVITY_LABELS[activity.activityType] || activity.activityType}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">+{activity.points}pts</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.activityDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma atividade registrada ainda
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Histórico de Faixas */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Evolução de Faixas
              </h2>
              <div className="space-y-4">
                {beltHistory && beltHistory.length > 0 ? (
                  beltHistory.map((record, index) => (
                    <div key={record.id} className="relative">
                      {/* Linha conectora */}
                      {index < beltHistory.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        {/* Ícone da faixa */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 border-2 border-white"
                          style={{ backgroundColor: BELT_COLORS[record.newBelt] || "#gray" }}
                        >
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Informações */}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            Faixa {record.newBelt === "white" ? "Branca" : 
                                   record.newBelt === "yellow" ? "Amarela" :
                                   record.newBelt === "orange" ? "Laranja" :
                                   record.newBelt === "green" ? "Verde" :
                                   record.newBelt === "blue" ? "Azul" :
                                   record.newBelt === "purple" ? "Roxa" :
                                   record.newBelt === "brown" ? "Marrom" : "Preta"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.pointsAtUpgrade} pontos
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.upgradedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Comece registrando atividades para evoluir!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
