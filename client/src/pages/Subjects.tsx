import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Subjects() {
  const { data: subjects, isLoading } = trpc.subjects.list.useQuery();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disciplinas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as disciplinas que você leciona
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade em breve")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Disciplina
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : subjects && subjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color || "#10b981" }}
                    />
                    <CardTitle>{subject.name}</CardTitle>
                  </div>
                  {subject.code && (
                    <Badge variant="secondary">{subject.code}</Badge>
                  )}
                </div>
                {subject.description && (
                  <CardDescription className="line-clamp-2">
                    {subject.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
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
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma disciplina cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Adicione as disciplinas que você leciona para organizar melhor suas aulas
            </p>
            <Button onClick={() => toast.info("Funcionalidade em breve")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Disciplina
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
