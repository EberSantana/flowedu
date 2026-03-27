import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Bot, Key, Zap, BarChart3, Clock, CheckCircle2, XCircle, 
  RefreshCw, Trash2, Eye, EyeOff, TrendingUp, Activity,
  AlertCircle, DollarSign, Cpu, Database
} from "lucide-react";

// Mapeamento de features para nomes legíveis
const featureNames: Record<string, string> = {
  // Professor
  generate_exercise: "Gerar Exercício",
  generate_assessment: "Gerar Prova",
  generate_activity: "Gerar Atividade",
  suggest_lesson_plans: "Sugerir Planos de Aula",
  generate_mind_map: "Gerar Mapa Mental",
  generate_infographic: "Gerar Infográfico",
  extract_calendar_events: "Extrair Eventos do Calendário",
  learning_analytics: "Análise de Aprendizado",
  // Aluno
  student_study_tips: "Dicas de Estudo (Aluno)",
  student_study_material: "Material de Estudo (Aluno)",
  student_analysis: "Análise do Aluno",
  student_ai_hints: "Dicas de IA (Dúvidas)",
  student_pattern_analysis: "Análise de Padrões",
  student_study_suggestions: "Sugestões de Estudo",
  student_study_plan: "Plano de Estudo",
  // Sistema
  ct_answer_evaluation: "Avaliar Resposta (PC)",
  analyze_student: "Analisar Aluno",
  analyze_answer: "Analisar Resposta",
  generate_content: "Gerar Conteúdo",
  other: "Outros",
};

// Modelos disponíveis por provedor
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

  // Queries
  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = trpc.aiSettings.getSettings.useQuery();
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.aiSettings.getUsageStats.useQuery({ period });

  // Mutations
  const saveSettingsMut = trpc.aiSettings.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas!", { description: "As configurações de IA foram atualizadas com sucesso." });
      refetchSettings();
    },
    onError: (err) => {
      toast.error("Erro ao salvar", { description: err.message });
    },
  });

  const testConnectionMut = trpc.aiSettings.testConnection.useMutation({
    onSuccess: (data) => {
      setTestResult({ success: data.success, message: data.message });
      setIsTesting(false);
    },
    onError: (err) => {
      setTestResult({ success: false, message: err.message });
      setIsTesting(false);
    },
  });

  const clearLogsMut = trpc.aiSettings.clearUsageLogs.useMutation({
    onSuccess: () => {
      toast.success("Logs limpos!", { description: `Logs com mais de ${clearDays} dias foram removidos.` });
      refetchStats();
    },
    onError: (err) => {
      toast.error("Erro ao limpar logs", { description: err.message });
    },
  });

  // Preencher formulário com dados atuais
  useEffect(() => {
    if (settings) {
      setSelectedProvider((settings.provider as any) || "groq");
      setSelectedModel(settings.model || "llama-3.3-70b-versatile");
    }
  }, [settings]);

  // Atualizar modelo ao trocar provedor
  useEffect(() => {
    const models = modelsByProvider[selectedProvider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].value);
    }
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

  const providerColors: Record<string, string> = {
    groq: "bg-orange-100 text-orange-800 border-orange-200",
    gemini: "bg-blue-100 text-blue-800 border-blue-200",
    manus: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Bot className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de IA</h1>
          <p className="text-sm text-gray-500">Gerencie provedores, chaves de API e monitore o uso da inteligência artificial</p>
        </div>
      </div>

      {/* Status atual */}
      {settings && (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Provedor ativo:</span>
                <Badge className={providerColors[settings.provider] || "bg-gray-100 text-gray-800"}>
                  {settings.provider?.toUpperCase() || "GROQ"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Modelo:</span>
                <span className="text-sm text-gray-600">{settings.model}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Chave Groq:</span>
                {settings.hasGroqKey ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Configurada ({settings.groqApiKeyPreview}...)
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" /> Não configurada
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Key className="h-4 w-4" /> Configurações
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Uso & Gastos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* Aba: Configurações */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provedor e Modelo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Provedor de IA
                </CardTitle>
                <CardDescription>Escolha qual serviço de IA usar para geração de conteúdo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groq">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500">⚡</span> Groq (Recomendado)
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">✦</span> Google Gemini
                        </div>
                      </SelectItem>
                      <SelectItem value="manus">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">◆</span> Manus AI (Padrão)
                        </div>
                      </SelectItem>
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
                      {(modelsByProvider[selectedProvider] || []).map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de teste */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" /> Testar Conexão</>
                    )}
                  </Button>
                  {testResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${testResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {testResult.success ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
                      {testResult.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chaves de API */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500" />
                  Chaves de API
                </CardTitle>
                <CardDescription>Configure as chaves de autenticação para cada provedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Groq API Key */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-orange-500">⚡</span> Chave API Groq
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
                  <p className="text-xs text-gray-500">Obtenha em: <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.groq.com</a></p>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-blue-500">✦</span> Chave API Gemini
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
                  <p className="text-xs text-gray-500">Obtenha em: <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">aistudio.google.com</a></p>
                </div>

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
              </CardContent>
            </Card>
          </div>

          {/* Informações sobre preços */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Informações de Preços (Groq)</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Llama 3.3 70B: $0,59/1M tokens de entrada · $0,79/1M tokens de saída · 
                    <strong> Plano gratuito:</strong> 14.400 req/dia, 500K tokens/min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Uso & Gastos */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          {/* Filtro de período */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Período:</span>
            {[
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "90d", label: "90 dias" },
              { value: "all", label: "Todo o período" },
            ].map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value as any)}
                className={period === p.value ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {p.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4 pb-4">
                    <div className="h-16 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total de Chamadas</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalCalls)}</p>
                        <p className="text-xs text-green-600">{stats.successCalls} sucesso · <span className="text-red-600">{stats.errorCalls} erro</span></p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tokens Totais</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalTokens)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(stats.promptTokens)} entrada · {formatNumber(stats.completionTokens)} saída</p>
                      </div>
                      <Database className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Custo Estimado</p>
                        <p className="text-2xl font-bold text-gray-900">${stats.estimatedCost.toFixed(4)}</p>
                        <p className="text-xs text-gray-500">USD (Groq)</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalCalls > 0 ? Math.round((stats.successCalls / stats.totalCalls) * 100) : 100}%
                        </p>
                        <p className="text-xs text-gray-500">{stats.successCalls}/{stats.totalCalls} chamadas</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Uso por funcionalidade */}
              {stats.byFeature && stats.byFeature.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      Uso por Funcionalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.byFeature.map((f: any, i: number) => {
                        const maxCalls = stats.byFeature[0]?.calls || 1;
                        const pct = Math.round((f.calls / maxCalls) * 100);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{featureNames[f.feature] || f.feature}</span>
                              <span className="text-gray-500">{f.calls} chamadas · {formatNumber(f.tokens || 0)} tokens</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Uso por provedor */}
              {stats.byProvider && stats.byProvider.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      Uso por Provedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {stats.byProvider.map((p: any, i: number) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${providerColors[p.provider] || "bg-gray-50 border-gray-200"}`}>
                          <div>
                            <p className="font-semibold text-sm">{p.provider?.toUpperCase()}</p>
                            <p className="text-xs">{p.calls} chamadas · {formatNumber(p.tokens || 0)} tokens</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Uso diário — gráfico de linha */}
              {stats.daily && stats.daily.length > 0 && (() => {
                const dailySlice = stats.daily.slice(-30);
                const labels = dailySlice.map((d: any) => {
                  const dt = new Date(d.date);
                  return `${String(dt.getUTCDate()).padStart(2,'0')}/${String(dt.getUTCMonth()+1).padStart(2,'0')}`;
                });
                const callsData = dailySlice.map((d: any) => Number(d.calls) || 0);
                const tokensData = dailySlice.map((d: any) => Number(d.tokens) || 0);
                const chartData = {
                  labels,
                  datasets: [
                    {
                      label: 'Chamadas',
                      data: callsData,
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99,102,241,0.12)',
                      pointBackgroundColor: '#6366f1',
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      fill: true,
                      tension: 0.4,
                      yAxisID: 'yCalls',
                    },
                    {
                      label: 'Tokens',
                      data: tokensData,
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16,185,129,0.08)',
                      pointBackgroundColor: '#10b981',
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      fill: true,
                      tension: 0.4,
                      yAxisID: 'yTokens',
                    },
                  ],
                };
                const chartOptions: any = {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index' as const, intersect: false },
                  plugins: {
                    legend: { position: 'top' as const, labels: { boxWidth: 12, font: { size: 12 } } },
                    tooltip: {
                      callbacks: {
                        label: (ctx: any) => {
                          if (ctx.dataset.yAxisID === 'yTokens') return ` Tokens: ${formatNumber(ctx.parsed.y)}`;
                          return ` Chamadas: ${ctx.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(0,0,0,0.04)' },
                      ticks: { font: { size: 11 }, maxTicksLimit: 14 },
                    },
                    yCalls: {
                      type: 'linear' as const,
                      position: 'left' as const,
                      title: { display: true, text: 'Chamadas', font: { size: 11 }, color: '#6366f1' },
                      grid: { color: 'rgba(0,0,0,0.04)' },
                      ticks: { font: { size: 11 }, precision: 0 },
                      beginAtZero: true,
                    },
                    yTokens: {
                      type: 'linear' as const,
                      position: 'right' as const,
                      title: { display: true, text: 'Tokens', font: { size: 11 }, color: '#10b981' },
                      grid: { drawOnChartArea: false },
                      ticks: {
                        font: { size: 11 },
                        callback: (v: any) => formatNumber(v),
                      },
                      beginAtZero: true,
                    },
                  },
                };
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Evolução de Uso Diário
                        <span className="text-xs font-normal text-gray-400 ml-1">(últimos {dailySlice.length} dias)</span>
                      </CardTitle>
                      <CardDescription className="text-xs">Chamadas à API e tokens consumidos por dia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: 280 }}>
                        <Line data={chartData} options={chartOptions} />
                      </div>
                      {/* Tabela resumida abaixo do gráfico */}
                      <details className="mt-4">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">Ver tabela de dados</summary>
                        <div className="overflow-x-auto mt-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-gray-400">
                                <th className="text-left py-1.5 pr-4">Data</th>
                                <th className="text-right py-1.5 pr-4">Chamadas</th>
                                <th className="text-right py-1.5">Tokens</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailySlice.slice().reverse().map((d: any, i: number) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="py-1.5 pr-4 text-gray-500">{formatDate(d.date)}</td>
                                  <td className="py-1.5 pr-4 text-right font-medium">{d.calls}</td>
                                  <td className="py-1.5 text-right text-gray-400">{formatNumber(d.tokens || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                );
              })()}

              {stats.totalCalls === 0 && (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum uso de IA registrado neste período.</p>
                    <p className="text-sm text-gray-400 mt-1">Os logs começarão a aparecer quando a IA for utilizada.</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-gray-700">Últimas 20 chamadas à API</h3>
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
            <Card className="animate-pulse">
              <CardContent className="pt-4 pb-4">
                <div className="h-40 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ) : stats?.recent && stats.recent.length > 0 ? (
            <Card>
              <CardContent className="pt-4 pb-0">
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
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            <span className="text-gray-500">{formatNumber(log.totalTokens || 0)}</span>
                          </td>
                          <td className="py-2 text-center">
                            {log.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <span title={log.errorMessage || ''}><XCircle className="h-4 w-4 text-red-500 mx-auto" /></span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum histórico de uso encontrado.</p>
                <p className="text-sm text-gray-400 mt-1">O histórico aparecerá aqui quando a IA for utilizada.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
