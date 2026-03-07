import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Activity,
  GraduationCap,
  UserCheck,
  RefreshCw,
  TrendingUp,
  Flame,
} from "lucide-react";

// Dias da semana em PT-BR (0=Dom, 1=Seg, ..., 6=Sab)
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
// Horas do dia agrupadas de 2 em 2 para melhor visualização
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-gray-100";
  const ratio = value / max;
  if (ratio < 0.15) return "bg-blue-100";
  if (ratio < 0.30) return "bg-blue-200";
  if (ratio < 0.45) return "bg-blue-300";
  if (ratio < 0.60) return "bg-blue-400";
  if (ratio < 0.75) return "bg-orange-400";
  if (ratio < 0.90) return "bg-orange-500";
  return "bg-red-500";
}

function getHeatTextColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "text-gray-300";
  const ratio = value / max;
  return ratio >= 0.60 ? "text-white" : "text-gray-700";
}

export default function AccessLogsPage() {
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(30);
  const [filterType, setFilterType] = useState<"all" | "teacher" | "student">("all");
  const [heatmapDays, setHeatmapDays] = useState(90);
  const [heatmapUserType, setHeatmapUserType] = useState<"all" | "teacher" | "student">("all");

  const { data, isLoading, refetch, isFetching } = trpc.accessLogs.getSummary.useQuery(
    { days },
    { refetchOnWindowFocus: false }
  );

  const { data: heatmapData, isLoading: heatmapLoading } = trpc.accessLogs.getHeatmap.useQuery(
    { days: heatmapDays, userType: heatmapUserType },
    { refetchOnWindowFocus: false }
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = data?.byDay.find((d) => d.date === today);
  const todayTotal = (todayEntry?.teachers ?? 0) + (todayEntry?.students ?? 0);

  const filteredLogs = (data?.recentLogs ?? []).filter((log) => {
    if (filterType === "all") return true;
    return log.userType === filterType;
  });

  // Calcular o valor máximo da matriz para normalizar as cores
  const matrix = heatmapData?.matrix ?? [];
  const maxValue = matrix.length > 0
    ? Math.max(...matrix.flatMap((row) => row))
    : 0;

  // Encontrar o pico de acesso
  let peakDay = -1, peakHour = -1, peakVal = 0;
  matrix.forEach((row, d) => {
    row.forEach((val, h) => {
      if (val > peakVal) { peakVal = val; peakDay = d; peakHour = h; }
    });
  });

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Administração" },
              { label: "Log de Acessos" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                Log de Acessos
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitore os acessos de professores e alunos ao sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={days.toString()}
                onValueChange={(v) => setDays(Number(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Acessos
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "—" : data?.totalAll ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">nos últimos {days} dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Professores
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? "—" : data?.totalTeacher ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">acessos de professores</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alunos
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? "—" : data?.totalStudent ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">acessos de alunos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Acessos Hoje
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? "—" : todayTotal}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayEntry?.teachers ?? 0} prof. · {todayEntry?.students ?? 0} alunos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== MAPA DE CALOR SEMANAL ===== */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Mapa de Calor — Acessos por Dia e Horário
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Identifique os momentos de maior engajamento para planejar comunicados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={heatmapUserType}
                    onValueChange={(v) => setHeatmapUserType(v as "all" | "teacher" | "student")}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="teacher">Professores</SelectItem>
                      <SelectItem value="student">Alunos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={heatmapDays.toString()}
                    onValueChange={(v) => setHeatmapDays(Number(v))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {heatmapLoading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Carregando mapa de calor...</p>
              ) : !heatmapData || heatmapData.total === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum acesso registrado no período selecionado.
                </p>
              ) : (
                <>
                  {/* Pico de acesso */}
                  {peakDay >= 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                      <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>
                        <strong>Pico de acessos:</strong> {DAYS[peakDay]}feira às {peakHour}h–{peakHour + 1}h
                        com <strong>{peakVal} acessos</strong> — melhor momento para enviar comunicados!
                      </span>
                    </div>
                  )}

                  {/* Grade do mapa de calor */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Cabeçalho de horas */}
                      <div className="flex mb-1">
                        <div className="w-10 shrink-0" />
                        {HOURS.map((h) => (
                          <div
                            key={h}
                            className="flex-1 text-center text-[10px] text-muted-foreground font-mono"
                          >
                            {h % 3 === 0 ? `${h}h` : ""}
                          </div>
                        ))}
                      </div>

                      {/* Linhas por dia da semana */}
                      {DAYS.map((day, d) => (
                        <div key={d} className="flex items-center mb-1">
                          <div className="w-10 shrink-0 text-xs font-medium text-muted-foreground text-right pr-2">
                            {day}
                          </div>
                          {HOURS.map((h) => {
                            const val = matrix[d]?.[h] ?? 0;
                            return (
                              <div
                                key={h}
                                title={`${day} ${h}h: ${val} acesso${val !== 1 ? "s" : ""}`}
                                className={`flex-1 h-7 mx-px rounded-sm flex items-center justify-center cursor-default transition-opacity hover:opacity-80 ${getHeatColor(val, maxValue)}`}
                              >
                                {val > 0 && (
                                  <span className={`text-[9px] font-bold ${getHeatTextColor(val, maxValue)}`}>
                                    {val}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Legenda */}
                      <div className="flex items-center gap-2 mt-3 justify-end">
                        <span className="text-xs text-muted-foreground">Menos</span>
                        {["bg-gray-100", "bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-orange-400", "bg-orange-500", "bg-red-500"].map((c, i) => (
                          <div key={i} className={`w-5 h-4 rounded-sm ${c}`} />
                        ))}
                        <span className="text-xs text-muted-foreground">Mais</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ranking de Usuários */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  Top Professores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !data?.topTeachers?.length ? (
                  <p className="text-muted-foreground text-sm">Nenhum acesso registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topTeachers.map((t, i) => (
                      <div key={t.name} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}º</span>
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                        <Badge variant="secondary">{t.count} acessos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  Top Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !data?.topStudents?.length ? (
                  <p className="text-muted-foreground text-sm">Nenhum acesso registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {data.topStudents.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}º</span>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <Badge variant="secondary">{s.count} acessos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Acessos Recentes */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  Acessos Recentes
                </CardTitle>
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as "all" | "teacher" | "student")}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="teacher">Somente Professores</SelectItem>
                    <SelectItem value="student">Somente Alunos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Carregando...</p>
              ) : !filteredLogs.length ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  Nenhum acesso encontrado para o filtro selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Data / Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge
                              variant={log.userType === "teacher" ? "default" : "secondary"}
                              className={
                                log.userType === "teacher"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                              }
                            >
                              {log.userType === "teacher" ? "Professor" : "Aluno"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.userName ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono">
                            {log.ipAddress ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(log.accessedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
