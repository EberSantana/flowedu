import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bot, Key, Zap, BarChart3, Clock, CheckCircle2, XCircle,
  RefreshCw, Trash2, Eye, EyeOff, Activity, AlertCircle,
  Cpu, ArrowLeft, TrendingUp, DollarSign, Database,
} from "lucide-react";

const featureNames: Record<string, string> = {
  generate_exercise: "Gerar Exercício",
  generate_assessment: "Gerar Prova",
  generate_activity: "Gerar Atividade",
  suggest_lesson_plans: "Sugerir Planos de Aula",
  generate_mind_map: "Gerar Mapa Mental",
  generate_infographic: "Gerar Infográfico",
  extract_calendar_events: "Extrair Eventos do Calendário",
  learning_analytics: "Análise de Aprendizado",
  student_study_tips: "Dicas de Estudo (Aluno)",
  student_study_material: "Material de Estudo (Aluno)",
  student_analysis: "Análise do Aluno",
  student_ai_hints: "Dicas de IA (Dúvidas)",
  student_pattern_analysis: "Análise de Padrões",
  student_study_suggestions: "Sugestões de Estudo",
  student_study_plan: "Plano de Estudo",
  ct_answer_evaluation: "Avaliar Resposta (PC)",
  analyze_student: "Analisar Aluno",
  analyze_answer: "Analisar Resposta",
  generate_content: "Gerar Conteúdo",
  other: "Outros",
};

const modelsByProvider: Record<string, { value: string; label: string }[]> = {
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Recomendado)" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Rápido)" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  ],
  gemini: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Rápido)" },
  ],
  manus: [
    { value: "manus-default", label: "Manus AI (Padrão)" },
  ],
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const providerColors: Record<string, string> = {
  groq: "bg-orange-100 text-orange-800 border-orange-200",
  gemini: "bg-blue-100 text-blue-800 border-blue-200",
  manus: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function AISettingsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"groq" | "gemini" | "manus">("groq");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearDays, setClearDays] = useState(90);

  const { data: settings, refetch: refetchSettings } = trpc.aiSettings.getSettings.useQuery();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.aiSettings.getUsageStats.useQuery({ period });

  const saveSettingsMut = trpc.aiSettings.saveSettings.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); refetchSettings(); },
    onError: (err) => toast.error("Erro ao salvar", { description: err.message }),
  });

  const testConnectionMut = trpc.aiSettings.testConnection.useMutation({
    onSuccess: (data) => { setTestResult({ success: data.success, message: data.message }); setIsTesting(false); },
    onError: (err) => { setTestResult({ success: false, message: err.message }); setIsTesting(false); },
  });

  const clearLogsMut = trpc.aiSettings.clearUsageLogs.useMutation({
    onSuccess: () => { toast.success("Logs limpos!"); refetchStats(); },
    onError: (err) => toast.error("Erro ao limpar logs", { description: err.message }),
  });

  useEffect(() => {
    if (settings) {
      setSelectedProvider((settings.provider as any) || "groq");
      setSelectedModel(settings.model || "llama-3.3-70b-versatile");
    }
  }, [settings]);

  useEffect(() => {
    const models = modelsByProvider[selectedProvider];
    if (models?.length > 0) setSelectedModel(models[0].value);
  }, [selectedProvider]);

  const handleSaveSettings = () => {
    saveSettingsMut.mutate({
      provider: selectedProvider,
      model: selectedModel,
      groqApiKey: groqApiKey || undefined,
      geminiApiKey: geminiApiKey || undefined,
    });
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    testConnectionMut.mutate({
      provider: selectedProvider,
      apiKey: selectedProvider === "groq" ? groqApiKey || undefined : selectedProvider === "gemini" ? geminiApiKey || undefined : undefined,
    });
  };

  const chartData = (() => {
    if (!stats?.daily || stats.daily.length === 0) return null;
    const labels = stats.daily.map((d: any) =>
      new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    );
    return {
      labels,
      datasets: [
        {
          label: "Chamadas",
          data: stats.daily.map((d: any) => d.calls),
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Tokens",
          data: stats.daily.map((d: any) => d.tokens),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };
  })();

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "top" as const }, title: { display: false } },
    scales: {
      y: { type: "linear", display: true, position: "left", title: { display: true, text: "Chamadas" } },
      y1: { type: "linear", display: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Tokens" } },
    },
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">

          {/* Botão Voltar */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                  <Bot className="w-8 h-8 text-purple-600" />
                  Configurações de IA
                </h1>
                <p className="text-muted-foreground">Gerencie provedores, chaves de API e monitore o uso da inteligência artificial</p>
              </div>
              {settings && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={providerColors[settings.provider] || "bg-gray-100 text-gray-800"}>
                    <Activity className="h-3 w-3 mr-1" />
                    {settings.provider?.toUpperCase() || "GROQ"}
                  </Badge>
                  {settings.hasGroqKey ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Chave configurada
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" /> Sem chave API
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==================== SEÇÃO 1: CONFIGURAÇÕES ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            {/* Coluna esquerda: Provedor e Modelo */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Cpu className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Provedor e Modelo</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Provedor de IA</Label>
                      <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="groq">🟠 Groq (Recomendado)</SelectItem>
                          <SelectItem value="gemini">🔵 Google Gemini</SelectItem>
                          <SelectItem value="manus">🟣 Manus AI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelsByProvider[selectedProvider]?.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleTestConnection}
                        disabled={isTesting || testConnectionMut.isPending}
                      >
                        {isTesting ? (
                          <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                        ) : (
                          <><Zap className="h-4 w-4 mr-2" /> Testar Conexão</>
                        )}
                      </Button>
                      {testResult && (
                        <div className={`mt-2 p-2 rounded text-sm flex items-center gap-2 ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {testResult.success
                            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            : <XCircle className="h-4 w-4 flex-shrink-0" />}
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita: Chaves de API */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Key className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Chaves de API</h2>
                  </div>
                  <div className="space-y-5">
                    {/* Groq API Key */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="text-orange-500">●</span> Chave API Groq
                        {settings?.hasGroqKey && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Configurada</Badge>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type={showGroqKey ? "text" : "password"}
                          placeholder={settings?.hasGroqKey ? `${settings.groqApiKeyPreview}••••••••••••••••` : "gsk_..."}
                          value={groqApiKey}
                          onChange={(e) => setGroqApiKey(e.target.value)}
                          className="font-mono text-sm"
                        />
                        <Button variant="ghost" size="icon" onClick={() => setShowGroqKey(!showGroqKey)}>
                          {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Obtenha em: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.groq.com</a>
                      </p>
                    </div>
                    {/* Gemini API Key */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="text-blue-500">●</span> Chave API Gemini
                        {settings?.hasGeminiKey && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Configurada</Badge>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type={showGeminiKey ? "text" : "password"}
                          placeholder={settings?.hasGeminiKey ? `${settings.geminiApiKeyPreview}••••••••••••••••` : "AIza..."}
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          className="font-mono text-sm"
                        />
                        <Button variant="ghost" size="icon" onClick={() => setShowGeminiKey(!showGeminiKey)}>
                          {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Obtenha em: <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">aistudio.google.com</a>
                      </p>
                    </div>
                    {/* Aviso de preços */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        <strong>Groq — Plano gratuito:</strong> 14.400 req/dia · 500K tokens/min · Llama 3.3 70B: $0,59/1M tokens entrada
                      </p>
                    </div>
                    {/* Botão salvar */}
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleSaveSettings}
                      disabled={saveSettingsMut.isPending}
                    >
                      {saveSettingsMut.isPending ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Configurações</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ==================== SEÇÃO 2: USO & GASTOS ==================== */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Uso & Gastos</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">Período:</span>
                  {(["7d", "30d", "90d", "all"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPeriod(p)}
                      className={period === p ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "90 dias" : "Tudo"}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => refetchStats()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : stats ? (
                <>
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-700">Total de Chamadas</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900">{formatNumber(stats.totalCalls)}</p>
                      <p className="text-xs text-indigo-600 mt-1">{stats.successCalls} sucesso</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Total de Tokens</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(stats.totalTokens)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {formatNumber(stats.promptTokens)} entrada · {formatNumber(stats.completionTokens)} saída
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">Custo Estimado</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-900">${stats.estimatedCost?.toFixed(4)}</p>
                      <p className="text-xs text-amber-600 mt-1">USD (Groq pricing)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">Taxa de Sucesso</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalCalls > 0 ? ((stats.successCalls / stats.totalCalls) * 100).toFixed(1) : "0.0"}%</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {stats.successCalls} ok · {stats.errorCalls} erros
                      </p>
                    </div>
                  </div>

                  {/* Gráfico de linha */}
                  {chartData && stats.totalCalls > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-3">Evolução Diária</h3>
                      <div style={{ height: "260px" }}>
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  )}

                  {/* Uso por feature */}
                  {stats.byFeature && stats.byFeature.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-3">Uso por Funcionalidade</h3>
                      <div className="space-y-2">
                        {stats.byFeature.slice(0, 8).map((f: any) => {
                          const pct = stats.totalCalls > 0 ? Math.round((f.calls / stats.totalCalls) * 100) : 0;
                          return (
                            <div key={f.feature} className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 w-44 truncate flex-shrink-0">
                                {featureNames[f.feature] || f.feature}
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                                {f.calls} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {stats.totalCalls === 0 && (
                    <div className="text-center py-10">
                      <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhum uso de IA registrado neste período.</p>
                      <p className="text-sm text-gray-400 mt-1">Os logs começarão a aparecer quando a IA for utilizada.</p>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* ==================== SEÇÃO 3: HISTÓRICO ==================== */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Histórico de Chamadas</h2>
                  <span className="text-sm text-gray-400">(últimas 20)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-500">Limpar logs com mais de</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={clearDays}
                    onChange={(e) => setClearDays(parseInt(e.target.value) || 90)}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-sm text-gray-500">dias</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => clearLogsMut.mutate({ olderThanDays: clearDays })}
                    disabled={clearLogsMut.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>

              {loadingStats ? (
                <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />
              ) : stats?.recent && stats.recent.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-500 text-xs uppercase">
                        <th className="text-left py-2 pr-3">Data/Hora</th>
                        <th className="text-left py-2 pr-3">Provedor</th>
                        <th className="text-left py-2 pr-3">Funcionalidade</th>
                        <th className="text-right py-2 pr-3">Tokens</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.map((log: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge className={`text-xs ${providerColors[log.provider] || "bg-gray-100 text-gray-600"}`}>
                              {log.provider?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-gray-700">{featureNames[log.feature] || log.feature}</td>
                          <td className="py-2 pr-3 text-right font-mono text-xs text-gray-500">
                            {formatNumber(log.totalTokens || 0)}
                          </td>
                          <td className="py-2 text-center">
                            {log.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <span title={log.errorMessage || ""}>
                                <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum histórico de uso encontrado.</p>
                  <p className="text-sm text-gray-400 mt-1">O histórico aparecerá aqui quando a IA for utilizada.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </PageWrapper>
    </>
  );
}
