import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { Link } from "wouter";

interface StudentRankingWidgetProps {
  subjectId: number;
  subjectName: string;
}

export function StudentRankingWidget({ subjectId, subjectName }: StudentRankingWidgetProps) {
  const { data: position } = trpc.gamification.getMyPosition.useQuery({ subjectId });

  if (!position || !position.studentData) {
    return null;
  }

  const { position: rank, totalStudents, studentData } = position;

  const getPositionColor = () => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-500";
    if (rank === 3) return "text-amber-700";
    if (rank <= 10) return "text-blue-600";
    return "text-muted-foreground";
  };

  const getPositionEmoji = () => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 10) return "🏆";
    return "📊";
  };

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-100 text-gray-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      brown: "bg-amber-100 text-amber-800",
      black: "bg-gray-800 text-white",
    };
    return colors[belt] || colors.white;
  };

  const getBeltLabel = (belt: string) => {
    const labels: Record<string, string> = {
      white: "Branca",
      yellow: "Amarela",
      orange: "Laranja",
      green: "Verde",
      blue: "Azul",
      purple: "Roxa",
      brown: "Marrom",
      black: "Preta",
    };
    return labels[belt] || "Branca";
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking em {subjectName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Posição atual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getPositionEmoji()}</div>
              <div>
                <p className="text-sm text-muted-foreground">Sua posição</p>
                <p className={`text-3xl font-bold ${getPositionColor()}`}>
                  {rank}º
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">de {totalStudents} alunos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Top {Math.round((rank / totalStudents) * 100)}%
              </p>
            </div>
          </div>

          {/* Pontos e faixa */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
              <p className="text-2xl font-bold">{studentData.totalPoints}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Faixa</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBeltColor(studentData.currentBelt)}`}>
                {getBeltLabel(studentData.currentBelt)}
              </span>
            </div>
          </div>

          {/* Sequência */}
          {studentData.streakDays > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Sequência ativa: {studentData.streakDays} dias
                  </p>
                  <p className="text-xs text-orange-700">Continue assim!</p>
                </div>
              </div>
            </div>
          )}

          {/* Link para estatísticas completas */}
          <Link href="/student-stats" className="block w-full text-center text-sm text-primary hover:underline">
            Ver estatísticas completas →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
