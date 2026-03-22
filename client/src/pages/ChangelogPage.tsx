import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bug, Sparkles, Wrench, Shield, ArrowLeft, Star, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

type ChangeType = "feature" | "fix" | "improvement" | "security";

interface ChangeEntry {
  type: ChangeType;
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  label?: string;
  highlight?: string;
  changes: ChangeEntry[];
}

const changelog: VersionEntry[] = [
  {
    version: "5.5.0",
    date: "22/03/2026",
    label: "Mais recente",
    highlight: "Ações Rápidas reorganizadas no Dashboard",
    changes: [
      {
        type: "improvement",
        text: "Ações Rápidas do Dashboard reorganizadas com foco nas tarefas diárias: Atividades em Sala, Boletim, Avisos, Grade Semanal, Dúvidas dos Alunos e Banco de Provas",
      },
      {
        type: "improvement",
        text: "Removidas ações de baixa frequência (Nova Disciplina, Metodologias) das ações rápidas padrão",
      },
      {
        type: "improvement",
        text: "Página de Novidades reformulada seguindo o padrão visual do sistema",
      },
    ],
  },
  {
    version: "5.4.0",
    date: "22/03/2026",
    highlight: "Reorganização do menu e correção crítica de autenticação",
    changes: [
      {
        type: "improvement",
        text: "Menu lateral reorganizado: seções renomeadas para Relatórios, Conteúdo e Comunicação para melhor clareza",
      },
      {
        type: "improvement",
        text: "Atividades em Sala movida para a seção Conteúdo no menu lateral",
      },
      {
        type: "fix",
        text: "Correção crítica de autenticação: variáveis de ambiente (JWT_SECRET, VAPID keys) agora embutidas diretamente no ecosystem.config.cjs do PM2 v6",
      },
    ],
  },
  {
    version: "5.3.0",
    date: "22/03/2026",
    highlight: "Página de Novidades e histórico de versões",
    changes: [
      {
        type: "feature",
        text: "Página de Novidades — histórico completo de versões acessível pela sidebar e Central de Ajuda",
      },
      {
        type: "improvement",
        text: "Link 'Novidades' adicionado na sidebar do professor em modo expandido e colapsado",
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
    highlight: "Filtro de datas e notificações automáticas",
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
    highlight: "Correção de links e política de versionamento",
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
    highlight: "Fusos horários, exportação CSV e correções de notas",
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
    bgColor: "bg-blue-50 dark:bg-blue-950",
    color: "text-blue-600 dark:text-blue-400",
  },
  fix: {
    icon: <Bug className="h-3.5 w-3.5" />,
    label: "Correção",
    bgColor: "bg-red-50 dark:bg-red-950",
    color: "text-red-600 dark:text-red-400",
  },
  improvement: {
    icon: <Wrench className="h-3.5 w-3.5" />,
    label: "Melhoria",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    color: "text-amber-600 dark:text-amber-400",
  },
  security: {
    icon: <Shield className="h-3.5 w-3.5" />,
    label: "Segurança",
    bgColor: "bg-green-50 dark:bg-green-950",
    color: "text-green-600 dark:text-green-400",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          {/* Botão Voltar */}
          <Link href="/ajuda">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Central de Ajuda
            </Button>
          </Link>

          {/* Cabeçalho — mesmo padrão da Central de Ajuda */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center mr-4">
                <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-4xl font-bold">Novidades do FlowEdu</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Histórico de atualizações e melhorias do sistema — veja o que há de novo em cada versão
            </p>
          </div>

          {/* Versão atual em destaque */}
          <Card className="mb-8 border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Versão atual instalada</p>
                  <p className="text-xl font-bold text-primary">v{changelog[0].version}</p>
                </div>
                <Badge className="ml-auto">Atualizado</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Lista de versões */}
          <div className="space-y-6">
            {changelog.map((entry, idx) => (
              <Card key={entry.version} className={idx === 0 ? "border-primary shadow-md" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">v{entry.version}</CardTitle>
                          {entry.label && (
                            <Badge variant="default" className="text-xs">
                              {entry.label}
                            </Badge>
                          )}
                        </div>
                        {entry.highlight && (
                          <CardDescription className="mt-0.5">{entry.highlight}</CardDescription>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground pt-1">{entry.date}</span>
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
              Para dúvidas sobre o sistema, acesse a{" "}
              <Link href="/ajuda" className="text-primary hover:underline">
                Central de Ajuda
              </Link>
              .
            </p>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
