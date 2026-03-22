import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Bug,
  Sparkles,
  Wrench,
  Shield,
  ArrowLeft,
} from "lucide-react";
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
    version: "5.2.0",
    date: "22/03/2026",
    label: "Mais recente",
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
        type: "fix",
        text: "Versão do sistema exibida na sidebar do professor e do aluno (desktop e mobile)",
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
        text: "Criado arquivo RULES.md com regra obrigatória: toda atualização do sistema deve incrementar a versão no package.json antes do deploy",
      },
    ],
  },
  {
    version: "5.0.0",
    date: "22/03/2026",
    changes: [
      {
        type: "fix",
        text: "Boletim do aluno: adicionada aba 'Provas' exibindo notas de provas submetidas (nota 0–10, pontuação bruta, status aprovado/reprovado e data)",
      },
      {
        type: "fix",
        text: "Gráfico de Evolução Individual: tooltip exibia 0.5/0.9 em vez de 5.0/9.0 — corrigida dupla conversão de escala",
      },
      {
        type: "fix",
        text: "Procedure getStudentReport não retornava notas de provas (assessment_attempts) — corrigida para incluir todos os dados de avaliação",
      },
      {
        type: "feature",
        text: "Seletor de fuso horário no Mapa de Calor: Acre/Roraima (UTC-5), Manaus/Cuiabá (UTC-4), Brasília/São Paulo (UTC-3), Fernando de Noronha (UTC-2)",
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

const typeConfig: Record<ChangeType, { icon: React.ReactNode; label: string; color: string }> = {
  feature: {
    icon: <Sparkles className="h-4 w-4" />,
    label: "Novidade",
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  fix: {
    icon: <Bug className="h-4 w-4" />,
    label: "Correção",
    color: "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800",
  },
  improvement: {
    icon: <Wrench className="h-4 w-4" />,
    label: "Melhoria",
    color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
  },
  security: {
    icon: <Shield className="h-4 w-4" />,
    label: "Segurança",
    color: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
  },
};

export default function ChangelogPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => setLocation("/help")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Ajuda
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Novidades do FlowEdu</h1>
            <p className="text-sm text-muted-foreground">
              Histórico de atualizações e melhorias do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Lista de versões */}
      <div className="relative">
        {/* Linha vertical do timeline */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-8">
          {changelog.map((entry, idx) => (
            <div key={entry.version} className="relative pl-8">
              {/* Ponto do timeline */}
              <div
                className={`absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  idx === 0
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                }`}
              >
                {idx === 0 && (
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </div>

              <Card className={idx === 0 ? "border-primary/40 shadow-sm" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">v{entry.version}</CardTitle>
                      {entry.label && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium shrink-0 mt-0.5 ${cfg.color}`}
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
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-10 text-center text-xs text-muted-foreground">
        FlowEdu — versão atual <strong>5.2.0</strong>
      </div>
    </div>
  );
}
