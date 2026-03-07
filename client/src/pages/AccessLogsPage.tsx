import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  GraduationCap,
  Activity,
  Clock,
  TrendingUp,
  Shield,
} from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", value: 7 },
  { label: "Últimos 30 dias", value: 30 },
  { label: "Últimos 90 dias", value: 90 },
  { label: "Último ano", value: 365 },
];

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccessLogsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = trpc.accessLogs.getSummary.useQuery({ days });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Log de Acessos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitoramento de acessos de professores e alunos ao sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Período:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">
            <Shield className="w-4 h-4 inline mr-2" />
            {error.message === "FORBIDDEN"
              ? "Acesso restrito. Apenas administradores podem visualizar os logs de acesso."
              : `Erro ao carregar dados: ${error.message}`}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted-foreground">Carregando dados...</span>
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Acessos</p>
                  <p className="text-3xl font-bold text-foreground">{data.totalAll}</p>
                  <p className="text-xs text-muted-foreground">nos últimos {days} dias</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Acessos de Professores</p>
                  <p className="text-3xl font-bold text-foreground">{data.totalTeacher}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.totalAll > 0
                      ? `${Math.round((data.totalTeacher / data.totalAll) * 100)}% do total`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Acessos de Alunos</p>
                  <p className="text-3xl font-bold text-foreground">{data.totalStudent}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.totalAll > 0
                      ? `${Math.round((data.totalStudent / data.totalAll) * 100)}% do total`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart: Acessos por dia */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Acessos por Dia
              </h2>
              {data.byDay.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  Nenhum acesso registrado no período selecionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.byDay.map((d) => ({
                      ...d,
                      date: formatDate(d.date),
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      interval={days > 30 ? Math.floor(data.byDay.length / 10) : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "teachers" ? "Professores" : "Alunos",
                      ]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "teachers" ? "Professores" : "Alunos"
                      }
                    />
                    <Bar dataKey="teachers" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="students" fill="#a855f7" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Professores */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  Professores com Mais Acessos
                </h2>
                {data.topTeachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum acesso de professor registrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.topTeachers.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground truncate">
                              {t.name}
                            </span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400 ml-2">
                              {t.count}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (t.count / (data.topTeachers[0]?.count || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Alunos */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-500" />
                  Alunos com Mais Acessos
                </h2>
                {data.topStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum acesso de aluno registrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.topStudents.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground truncate">
                              {s.name}
                            </span>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 ml-2">
                              {s.count}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (s.count / (data.topStudents[0]?.count || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Acessos Recentes
              </h2>
              {data.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum acesso registrado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Usuário
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Tipo
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          IP
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Data/Hora
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium text-foreground">
                            {log.userName || "—"}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.userType === "teacher"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              }`}
                            >
                              {log.userType === "teacher" ? (
                                <Users className="w-3 h-3" />
                              ) : (
                                <GraduationCap className="w-3 h-3" />
                              )}
                              {log.userType === "teacher" ? "Professor" : "Aluno"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                            {log.ipAddress || "—"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {formatDateTime(log.accessedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
