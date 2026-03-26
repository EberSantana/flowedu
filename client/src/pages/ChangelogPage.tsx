import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bug, Sparkles, Wrench, Shield, Star, Zap, CheckCircle2 } from "lucide-react";
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
    version: "5.13.0",
    date: "26/03/2026",
    label: "Mais recente",
    highlight: "Modal Evolução Individual compacto e responsivo",
    changes: [
      {
        type: "improvement",
        text: "Modal Evolução Individual redesenhado: cards menores e compactos (4 colunas fixas), gráfico reduzido para 220px, tabela com scroll horizontal e colunas ocultas no mobile",
      },
      {
        type: "improvement",
        text: "Modal com max-w-2xl e max-h-85vh para caber corretamente em qualquer resolução de tela",
      },
      {
        type: "fix",
        text: "Deploy na VPS corrigido definitivamente: script /root/deploy.sh agora sincroniza a versão nos dois diretórios (/root/flowedu e /var/www/flowedu) automaticamente",
      },
    ],
  },
  {
    version: "5.12.0",
    date: "26/03/2026",
    highlight: "Painel de Notas com turmas reais e Atividades de Sala integrada",
    changes: [
      {
        type: "fix",
        text: "Painel de Notas: filtro agora exibe Disciplina — Turma real (ex: \"Informática Básica — Turma IAGRO 11\") em vez de \"Turma Geral\" hardcoded",
      },
      {
        type: "feature",
        text: "Atividades de Sala integrada como terceira aba no Banco de Provas e Exercícios — item removido do menu lateral para evitar duplicidade",
      },
      {
        type: "improvement",
        text: "Componente ActivitiesTab criado com todas as funcionalidades: criar, editar, excluir, ver submissões, avaliar e exportar Excel",
      },
    ],
  },
  {
    version: "5.11.0",
    date: "26/03/2026",
    highlight: "Banco de Provas unificado com Exercícios e Atividades de Sala",
    changes: [
      {
        type: "feature",
        text: "Banco de Provas e Exercícios agora possui 3 abas: Provas, Exercícios e Atividades de Sala — centralizando todo o conteúdo avaliativo em uma única página",
      },
      {
        type: "improvement",
        text: "Item \"Atividades em Sala\" removido do menu lateral do professor (já acessível dentro do Banco de Provas)",
      },
    ],
  },
  {
    version: "5.10.0",
    date: "26/03/2026",
    highlight: "Notificações ao criar módulo na trilha e correção de links",
    changes: [
      {
        type: "feature",
        text: "Notificação automática enviada aos alunos ao professor criar novo módulo na Trilha de Aprendizagem, com link direto para /student-learning-paths",
      },
      {
        type: "fix",
        text: "Link da notificação do professor ao receber submissão de atividade corrigido de /student/activities para /activities",
      },
      {
        type: "fix",
        text: "Link das notificações de atividades para o aluno corrigido de /activities para /student/activities",
      },
    ],
  },
  {
    version: "5.9.0",
    date: "26/03/2026",
    highlight: "Evolução Individual redesenhada, avisos ao criar prova e correção de 404",
    changes: [
      {
        type: "improvement",
        text: "Cards de Evolução Individual redesenhados com gradiente, fonte maior (extrabold), label em maiúsculas e sombra para melhor destaque visual",
      },
      {
        type: "improvement",
        text: "Gráfico de Evolução Individual com altura aumentada (300px) e margem inferior maior para os rótulos do eixo X",
      },
      {
        type: "feature",
        text: "Notificação ao aluno ao criar prova agora inclui campo link com rota /student/assessments — tanto ao criar quanto ao publicar",
      },
      {
        type: "fix",
        text: "Erro 404 ao clicar em aviso de criação de prova/atividade corrigido — links das notificações apontam para as rotas corretas do portal do aluno",
      },
    ],
  },
  {
    version: "5.8.0",
    date: "26/03/2026",
    highlight: "Painel de Notas com turma, Atividades no Banco e modal do Calendário",
    changes: [
      {
        type: "improvement",
        text: "Painel de Notas: filtro exibe Disciplina — Turma juntos (ex: \"Matemática — 3º A\") e badge da turma aparece no cabeçalho da tabela",
      },
      {
        type: "improvement",
        text: "Atividades em Sala movida para a seção Conteúdo no Sidebar, ao lado de Banco de Provas e Exercícios",
      },
      {
        type: "feature",
        text: "Cards do Calendário clicáveis: ao clicar em um evento abre modal com título, data, tipo, descrição e botões de editar/excluir",
      },
    ],
  },
  {
    version: "5.7.0",
    date: "26/03/2026",
    highlight: "Menu do portal do aluno reorganizado",
    changes: [
      {
        type: "improvement",
        text: "Menu do portal do aluno reorganizado em seções mais coerentes: Principal, Estudos (com Atividades), Avaliações (Provas + Estatísticas + Boletim) e Suporte",
      },
      {
        type: "improvement",
        text: "\"Minhas Atividades\" movida de lugar solto para a seção Estudos, onde faz sentido semântico",
      },
      {
        type: "improvement",
        text: "Itens renomeados no portal do aluno: \"Exercícios\" → \"Exercícios da Trilha\" e \"Atividades\" → \"Atividades de Sala\"",
      },
    ],
  },
  {
    version: "5.6.0",
    date: "26/03/2026",
    highlight: "Migração para API Groq (Llama 3.3 70B)",
    changes: [
      {
        type: "improvement",
        text: "Sistema migrado da API Manus para API Groq (Llama 3.3 70B) — geração de exercícios, análise de alunos e módulos agora usam Groq com prioridade máxima",
      },
      {
        type: "improvement",
        text: "Código do llm.ts atualizado: Groq tem prioridade sobre a API Manus quando GROQ_API_KEY estiver configurada",
      },
      {
        type: "fix",
        text: "Chave Groq atualizada no ecosystem.config.cjs da VPS — chave anterior estava inválida causando falhas na geração de IA",
      },
    ],
  },
  {
    version: "5.5.1",
    date: "24/03/2026",
    highlight: "Contador de conclusão por exercício e correções gerais",
    changes: [
      {
        type: "feature",
        text: "Contador de conclusão em cada exercício do Banco de Provas: badges \"X fizeram\" (verde), \"X faltam\" (laranja) e \"X total\" (cinza) com barra de progresso percentual",
      },
      {
        type: "fix",
        text: "Correção de 6 exercícios com totalPoints incorreto (100 em vez de 10) no banco de dados",
      },
      {
        type: "improvement",
        text: "Personalizar Ações Rápidas expandido de 10 para 25 opções organizadas em 6 categorias",
      },
      {
        type: "fix",
        text: "Correção de campos varchar com limite pequeno que causavam erros ao cadastrar nomes longos (turmas, disciplinas, matrícula)",
      },
      {
        type: "feature",
        text: "Notificações automáticas para alunos ao criar atividade de sala, publicar exercício ou criar prova publicada",
      },
      {
        type: "improvement",
        text: "PWA corrigido para abrir na página correta (professor ou aluno) via detecção automática de perfil no localStorage",
      },
      {
        type: "fix",
        text: "Headers Cache-Control adicionados para index.html e sw.js — elimina erro \"Unable to preload CSS\" após deploy",
      },
      {
        type: "feature",
        text: "Página de manutenção HTML no Nginx exibida automaticamente durante reinicialização do PM2 (erros 502/503/504)",
      },
    ],
  },
  {
    version: "5.5.0",
    date: "22/03/2026",
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
