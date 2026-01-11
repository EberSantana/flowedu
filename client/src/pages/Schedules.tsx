import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Schedules() {
  const { data: teacher } = trpc.teachers.getCurrent.useQuery();
  const { data: schedules, isLoading } = trpc.schedules.listByTeacher.useQuery(
    { teacherId: teacher?.id ?? 0 },
    { enabled: !!teacher?.id }
  );

  const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const schedulesByDay = weekDays.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: schedules?.filter(s => s.dayOfWeek === index) ?? [],
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus horários de aulas semanais
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade em breve")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid gap-4">
          {schedulesByDay.map(({ day, dayIndex, schedules: daySchedules }) => (
            <Card key={dayIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day}
                </CardTitle>
                <CardDescription>
                  {daySchedules.length === 0
                    ? "Nenhuma aula agendada"
                    : `${daySchedules.length} ${daySchedules.length === 1 ? "aula" : "aulas"}`}
                </CardDescription>
              </CardHeader>
              {daySchedules.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.location || "Local não definido"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Funcionalidade em breve")}
                        >
                          Editar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum horário cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Comece adicionando suas aulas semanais para organizar melhor seu tempo
            </p>
            <Button onClick={() => toast.info("Funcionalidade em breve")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Aula
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
