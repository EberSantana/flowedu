import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, ListTodo, Clock, Award, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user } = useAuth();
  const { data: teacher, isLoading: teacherLoading } = trpc.teachers.getCurrent.useQuery();
  const { data: schedules, isLoading: schedulesLoading } = trpc.schedules.listByTeacher.useQuery(
    { teacherId: teacher?.id ?? 0 },
    { enabled: !!teacher?.id }
  );
  const { data: activities, isLoading: activitiesLoading } = trpc.activities.listByTeacher.useQuery(
    { teacherId: teacher?.id ?? 0 },
    { enabled: !!teacher?.id }
  );
  const { data: professionalBand } = trpc.professionalBands.getById.useQuery(
    { id: teacher?.professionalBandId ?? 0 },
    { enabled: !!teacher?.professionalBandId }
  );

  const pendingActivities = activities?.filter(a => a.status === "pending") ?? [];
  const completedActivities = activities?.filter(a => a.status === "completed") ?? [];
  const todaySchedules = schedules?.filter(s => s.dayOfWeek === new Date().getDay()) ?? [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="font-normal">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {getGreeting()}, {user?.name?.split(' ')[0] || "Professor"}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Gerencie seu tempo e atividades de forma eficiente e organizada
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aulas Hoje</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold mb-1">{todaySchedules.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {todaySchedules.length === 1 ? "aula agendada" : "aulas agendadas"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atividades Pendentes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold mb-1">{pendingActivities.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {pendingActivities.length === 1 ? "tarefa pendente" : "tarefas pendentes"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aulas Semanais</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold mb-1">{schedules?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  aulas na semana
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faixa Profissional</CardTitle>
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-violet-600 dark:text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            {teacherLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : professionalBand ? (
              <>
                <div className="text-xl font-bold mb-1 truncate">
                  {professionalBand.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {professionalBand.weeklyHours}h semanais
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold mb-1 text-muted-foreground">
                  Não definida
                </div>
                <Link href="/profile">
                  <Button variant="link" className="h-auto p-0 text-xs">
                    Configure seu perfil
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Aulas de Hoje</CardTitle>
                <CardDescription className="mt-1">
                  Suas aulas agendadas para hoje
                </CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.slice(0, 4).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {schedule.location || "Local não definido"}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/schedules">
                  <Button variant="outline" className="w-full group">
                    Ver todos os horários
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma aula agendada para hoje
                </p>
                <Link href="/schedules">
                  <Button variant="outline">
                    Gerenciar Horários
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Atividades Recentes</CardTitle>
                <CardDescription className="mt-1">
                  Suas tarefas e atividades pendentes
                </CardDescription>
              </div>
              <ListTodo className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : pendingActivities.length > 0 ? (
              <div className="space-y-3">
                {pendingActivities.slice(0, 4).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {activity.type === "planning" && "Planejamento"}
                          {activity.type === "grading" && "Correção"}
                          {activity.type === "meeting" && "Reunião"}
                          {activity.type === "training" && "Capacitação"}
                          {activity.type === "other" && "Outra"}
                        </Badge>
                        {activity.priority && (
                          <Badge 
                            variant={activity.priority === "high" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {activity.priority === "high" && "Alta"}
                            {activity.priority === "medium" && "Média"}
                            {activity.priority === "low" && "Baixa"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/activities">
                  <Button variant="outline" className="w-full group">
                    Ver todas as atividades
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Tudo em dia!
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Você não tem atividades pendentes
                </p>
                <Link href="/activities">
                  <Button variant="outline">
                    Gerenciar Atividades
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      {activities && activities.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Resumo de Progresso</CardTitle>
            <CardDescription>
              Acompanhe o andamento das suas atividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-500 mb-1">
                  {pendingActivities.length}
                </div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-1">
                  {activities.filter(a => a.status === "in_progress").length}
                </div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mb-1">
                  {completedActivities.length}
                </div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
