import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ListTodo, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Activities() {
  const { data: teacher } = trpc.teachers.getCurrent.useQuery();
  const { data: activities, isLoading } = trpc.activities.listByTeacher.useQuery(
    { teacherId: teacher?.id ?? 0 },
    { enabled: !!teacher?.id }
  );

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      planning: "Planejamento",
      grading: "Correção",
      meeting: "Reunião",
      training: "Capacitação",
      other: "Outra",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600 bg-green-50 border-green-200",
      medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
      high: "text-red-600 bg-red-50 border-red-200",
    };
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
    };
    return (
      <Badge variant="outline" className={colors[priority]}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas tarefas e atividades
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade em breve")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ListTodo className="h-5 w-5 text-primary" />
                      <CardTitle>{activity.title}</CardTitle>
                    </div>
                    {activity.description && (
                      <CardDescription className="line-clamp-2">
                        {activity.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(activity.status)}
                    {getPriorityBadge(activity.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{getTypeLabel(activity.type)}</Badge>
                    </div>
                    {activity.estimatedHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{activity.estimatedHours}h estimadas</span>
                      </div>
                    )}
                    {activity.dueDate && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Prazo: {new Date(activity.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Funcionalidade em breve")}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma atividade cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Adicione suas tarefas e atividades para organizar melhor seu tempo
            </p>
            <Button onClick={() => toast.info("Funcionalidade em breve")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Atividade
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
