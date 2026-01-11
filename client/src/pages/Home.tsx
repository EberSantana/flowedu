import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, ListTodo, Clock, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
  const todaySchedules = schedules?.filter(s => s.dayOfWeek === new Date().getDay()) ?? [];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {user?.name || "Professor"}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu tempo e atividades de forma eficiente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{todaySchedules.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {todaySchedules.length === 1 ? "aula agendada" : "aulas agendadas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Pendentes</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingActivities.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {pendingActivities.length === 1 ? "tarefa pendente" : "tarefas pendentes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{schedules?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              aulas na semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa Profissional</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {teacherLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {professionalBand?.name ?? "Não definida"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {professionalBand?.weeklyHours ? `${professionalBand.weeklyHours}h semanais` : "Configure seu perfil"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aulas de Hoje</CardTitle>
            <CardDescription>
              Suas aulas agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todaySchedules.length > 0 ? (
              <div className="space-y-2">
                {todaySchedules.slice(0, 3).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {schedule.location || "Local não definido"}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/schedules">
                  <Button variant="outline" className="w-full mt-2">
                    Ver todos os horários
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhuma aula agendada para hoje
                </p>
                <Link href="/schedules">
                  <Button variant="outline" className="mt-4">
                    Gerenciar Horários
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Suas tarefas e atividades pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pendingActivities.length > 0 ? (
              <div className="space-y-2">
                {pendingActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.type === "planning" && "Planejamento"}
                        {activity.type === "grading" && "Correção"}
                        {activity.type === "meeting" && "Reunião"}
                        {activity.type === "training" && "Capacitação"}
                        {activity.type === "other" && "Outra"}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/activities">
                  <Button variant="outline" className="w-full mt-2">
                    Ver todas as atividades
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade pendente
                </p>
                <Link href="/activities">
                  <Button variant="outline" className="mt-4">
                    Gerenciar Atividades
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
