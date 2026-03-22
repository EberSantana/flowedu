import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bug, Sparkles, Wrench, Shield, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type ChangeType = "feature" | "fix" | "improvement" | "security";

interface ChangeEntry {
  type: ChangeType;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  label?: string;
  changes: ChangeEntry[];
}

const changelog: VersionEntry[] = [
  {
    version: "5.3.0",
    date: "22/03/2026",
    label: "Mais recente",
    changes: [
      {
        type: "feature",
        text: "Página de Novidades — histórico completo de versões acessível pela sidebar e Central de Ajuda",
      },
      {
        type: "improvement",
        text: "Link 'Novidades' (✨) adicionado na sidebar do professor em modo expandido e colapsado",
      },
      {
        type: "improvement",
        text: "Card 'Novidades' adicionado na Central de Ajuda",
      },
    ],
  },
  {
    version: "5.2.0",
    date: "22/03/2026",
    changes: [
      {
        type: "feature",
        text: "Filtro de período personalizado no Mapa de Calor — seletor de datas De/Até além das opções de 30/90/180 dias",
      },
      {
        type: "feature",
        text: "Notificação automática ao aluno quando o professor corrige uma atividade — inclui nota (ex: 9.0/10) e trecho do feedback com link direto para Atividades",
      },
      {
        type: "improvement",
        text: "Versão do sistema exibida no rodapé da sidebar do professor e do aluno (desktop e mobile)",
      },
    ],
  },
  {
    version: "5.1.0",
    date: "22/03/2026",
    changes: [
      {
        type: "fix",
        text: "Corrigidos 5 links quebrados (404): /student-stats, /student/exercises, /student/learning-paths, /teacher-login, /teacher-register",
      },
      {
        type: "fix",
        text: "Notificações de atividades (professor e aluno) apontavam para /atividades-em-sala — corrigido para /activities e /student/activities",
      },
      {
        type: "fix",
        text: "Links antigos salvos no banco de dados atualizados diretamente via SQL para evitar 404 em notificações existentes",
      },
      {
        type: "improvement",
        text: "Regra de versionamento obrigatória: toda atualização do sistema deve incrementar a versão antes do deploy",
      },
    ],
  },
  {
    version: "5.0.0",
    date: "22/03/2026",
    changes: [
      {
        type: "fix",
        text: "Boletim do aluno: adicionada aba 'Provas' exibindo notas de provas submetidas (nota 0–10, pontuação bruta, status e data)",
      },
      {
        type: "fix",
        text: "Gráfico de Evolução Individual: tooltip exibia 0.5/0.9 em vez de 5.0/9.0 — corrigida dupla conversão de escala",
      },
      {
        type: "fix",
        text: "Procedure getStudentReport não retornava notas de provas — corrigida para incluir todos os dados de avaliação",
      },
      {
        type: "feature",
        text: "Seletor de fuso horário no Mapa de Calor: Acre (UTC-5), Manaus (UTC-4), Brasília (UTC-3), Fernando de Noronha (UTC-2)",
      },
      {
        type: "feature",
        text: "Botão 'Exportar Log de Acessos (CSV)' no Mapa de Calor com os filtros ativos",
      },
      {
        type: "improvement",
        text: "Removido botão redundante 'Exportar Mapa (CSV)' do Mapa de Calor",
      },
    ],
  },
];

const typeConfig: Record<ChangeType, { icon: React.ReactNode; label: string; bgColor: string; color: string }> = {
  feature: {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: "Novidade",
    bgColor: "bg-blue-50",
    color: "text-blue-600",
  },
  fix: {
    icon: <Bug className="h-3.5 w-3.5" />,
    label: "Correção",
    bgColor: "bg-red-50",
    color: "text-red-600",
  },
  improvement: {
    icon: <Wrench className="h-3.5 w-3.5" />,
    label: "Melhoria",
    bgColor: "bg-amber-50",
    color: "text-amber-600",
  },
  security: {
    icon: <Shield className="h-3.5 w-3.5" />,
    label: "Segurança",
    bgColor: "bg-green-50",
    color: "text-green-600",
  },
};

export default function ChangelogPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Voltar */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 text-muted-foreground"
        onClick={() => setLocation("/ajuda")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para Ajuda
      </Button>

      {/* Cabeçalho — igual ao padrão da Central de Ajuda */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <Star className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl font-bold">Novidades do FlowEdu</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Histórico de atualizações e melhorias do sistema
        </p>
      </div>

      {/* Lista de versões */}
      <div className="space-y-6">
        {changelog.map((entry, idx) => (
          <Card key={entry.version} className={idx === 0 ? "border-primary shadow-md" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">v{entry.version}</CardTitle>
                  {entry.label && (
                    <Badge className="text-xs">
                      {entry.label}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {entry.changes.map((change, cIdx) => {
                  const cfg = typeConfig[change.type];
                  return (
                    <li key={cIdx} className="flex items-start gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 mt-0.5 ${cfg.bgColor} ${cfg.color}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      <span className="text-sm text-foreground leading-relaxed">
                        {change.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted-foreground">
          Versão atual: <strong>v5.3.0</strong> · Para dúvidas, acesse a{" "}
          <button
            onClick={() => setLocation("/ajuda")}
            className="text-primary hover:underline"
          >
            Central de Ajuda
          </button>
          .
        </p>
      </div>
    </div>
  );
}
