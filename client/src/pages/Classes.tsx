import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GraduationCap, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Classes() {
  const { data: classes, isLoading } = trpc.classGroups.list.useQuery();

  const getShiftLabel = (shift: string | null) => {
    const labels: Record<string, string> = {
      morning: "Manhã",
      afternoon: "Tarde",
      evening: "Noite",
      full: "Integral",
    };
    return shift ? labels[shift] || shift : "Não definido";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as turmas que você leciona
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade em breve")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classGroup) => (
            <Card key={classGroup.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle>{classGroup.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{classGroup.academicYear}</Badge>
                </div>
                <CardDescription>
                  {classGroup.grade || "Série não definida"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {classGroup.studentCount || 0} alunos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getShiftLabel(classGroup.shift)}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => toast.info("Funcionalidade em breve")}
                >
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma turma cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Adicione as turmas que você leciona para organizar melhor suas aulas
            </p>
            <Button onClick={() => toast.info("Funcionalidade em breve")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Turma
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
