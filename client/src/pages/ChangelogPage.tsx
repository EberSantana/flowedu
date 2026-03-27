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
    version: "5.37.0",
    date: "27/03/2026",
    label: "Mais recente",
    highlight: "Login dark/tech, busca na Central de Ajuda e filtro disciplina+turma no Relatório de Trilhas",
    changes: [
      {
        type: "improvement",
        text: "Tela de login do professor redesenhada no estilo dark/tech — fundo escuro #080d1a, logo F com gradiente teal, inputs escuros e botão com gradiente, consistente com a nova tela de entrada",
      },
      {
        type: "feature",
        text: "Busca funcional em tempo real na Central de Ajuda — filtra 14 artigos ao digitar com badge de categoria, contador de resultados e botão para limpar a busca",
      },
      {
        type: "improvement",
        text: "Filtro disciplina+turma padronizado no Relatório de Trilhas de Aprendizado — mesmo visual 'Disciplina — Turma' das outras páginas de relatório",
      },
    ],
  },
  {
    version: "5.36.0",
    date: "27/03/2026",
    highlight: "Nova tela de entrada dark/tech com dois portais",
    changes: [
      {
        type: "feature",
        text: "Tela de entrada completamente redesenhada: fundo escuro (#080d1a), logo F com gradiente teal, ícones flutuantes animados, topbar com links de navegação e botão flowedu.app",
      },
      {
        type: "feature",
        text: "Dois cards de portal com hover interativo: Portal do Aluno (gradiente teal/azul) e Portal do Professor (gradiente roxo/pink) com ícones, tags e botões coloridos distintos",
      },
      {
        type: "improvement",
        text: "Loading state com logo animada em vez do spinner genérico, mantendo a identidade visual da nova entrada",
      },
    ],
  },
  {
    version: "5.35.0",
    date: "27/03/2026",
    highlight: "Filtro de disciplina vinculado à turma em Análise de IA e Relatório de Desempenho",
    changes: [
      {
        type: "improvement",
        text: "Filtro de disciplina em Análise de Aprendizado com IA agora exibe o formato 'Disciplina — Turma' (ex: Informática Básica — Turma INFW 11 - D1), facilitando a seleção quando a mesma disciplina existe em múltiplas turmas",
      },
      {
        type: "improvement",
        text: "Filtro de disciplina em Relatório de Desempenho de Exercícios também atualizado com o formato 'Disciplina — Turma' para consistência",
      },
    ],
  },
  {
    version: "5.34.0",
    date: "27/03/2026",
    highlight: "Validação instantânea de chaves de API e cache de IA invalidado ao salvar",
    changes: [
      {
        type: "feature",
        text: "Ao salvar uma chave de API em Configurações de IA, o sistema testa automaticamente a chave e exibe o badge 'Validada ✓' (verde) ou 'Inválida ✗' (vermelho) imediatamente no campo correspondente",
      },
      {
        type: "feature",
        text: "Cache de configurações de IA é invalidado imediatamente ao salvar: a IA passa a usar o novo provedor/chave sem esperar os 5 minutos do cache",
      },
      {
        type: "fix",
        text: "Corrigido erro 401 Unauthorized na geração de exercícios: o sistema agora usa corretamente a chave do provedor configurado no banco em vez do fallback do ambiente",
      },
      {
        type: "improvement",
        text: "Mensagem de erro detalhada exibida abaixo do campo quando a chave é inválida, facilitando o diagnóstico do problema",
      },
    ],
  },
  {
    version: "5.32.0",
    date: "27/03/2026",
    highlight: "Provedor de IA dinâmico e correção de contagem de alunos nas Atividades de Sala",
    changes: [
      {
        type: "feature",
        text: "A IA agora usa o provedor e modelo configurados em Configurações de IA (Groq, OpenAI, Anthropic, Gemini ou Manus) em vez de sempre usar o Groq padrão",
      },
      {
        type: "feature",
        text: "Cache inteligente de 5 minutos para as configurações de IA: alterações no provedor são aplicadas automaticamente sem reiniciar o servidor",
      },
      {
        type: "fix",
        text: "Corrigido bug no botão 'Alunos (X/Y enviaram)' nas Atividades de Sala: o total de alunos agora exibe corretamente quando os alunos estão matriculados via disciplina (subjectEnrollments) e não apenas via turma",
      },
      {
        type: "improvement",
        text: "max_tokens ajustado por provedor: Groq/Anthropic 8.192 · OpenAI 16.384 · Manus/Gemini 32.768 — evitando erros de limite",
      },
    ],
  },
  {
    version: "5.31.0",
    date: "27/03/2026",
    highlight: "Indicador de custo por provedor e alerta automático de chaves inválidas",
    changes: [
      {
        type: "feature",
        text: "Tabela de Custo por Provedor no painel Uso & Gastos: exibe chamadas, tokens, preço de entrada/saída e custo estimado separado para cada provedor (Groq, OpenAI, Anthropic, Gemini, Manus)",
      },
      {
        type: "feature",
        text: "Custo calculado com tabela de preços real por milhão de tokens: Groq $0,59/$0,79 · OpenAI $2,50/$10,00 · Anthropic $3,00/$15,00 · Gemini $1,25/$5,00 · Manus AI incluído",
      },
      {
        type: "feature",
        text: "Botão 'Verificar Chaves' no card de Chaves de API: testa cada chave configurada em tempo real e exibe o resultado (Válida / mensagem de erro) para cada provedor",
      },
      {
        type: "feature",
        text: "Verificação automática diária de chaves: job agendado todo dia às 7h (Manaus) que testa todas as chaves e envia notificação push ao administrador se alguma estiver inválida ou expirada",
      },
      {
        type: "improvement",
        text: "Card 'Custo Estimado' atualizado para exibir 6 casas decimais e refletir o custo real por provedor em vez de usar apenas o preço do Groq",
      },
    ],
  },
  {
    version: "5.30.0",
    date: "27/03/2026",
    highlight: "Configurações de IA: suporte a 5 provedores com chaves manuais",
    changes: [
      {
        type: "feature",
        text: "Adicionados provedores OpenAI (ChatGPT) e Anthropic (Claude) nas Configurações de IA — agora são 5 provedores disponíveis: Groq, OpenAI, Anthropic, Gemini e Manus AI",
      },
      {
        type: "feature",
        text: "Cada provedor tem seu próprio campo de chave de API com botão mostrar/ocultar, indicador de status (configurada/não configurada) e link direto para obter a chave",
      },
      {
        type: "feature",
        text: "Modelos disponíveis por provedor: Groq (Llama 3.3 70B, Mixtral), OpenAI (GPT-4o, GPT-4o Mini, GPT-3.5), Anthropic (Claude 3.5 Sonnet, Haiku, Opus), Gemini (1.5 Pro, Flash, 2.0)",
      },
      {
        type: "improvement",
        text: "Testar Conexão agora funciona para todos os 5 provedores, incluindo verificação real da chave via API",
      },
      {
        type: "improvement",
        text: "Informações de preço de cada provedor exibidas diretamente na tela para facilitar a escolha",
      },
    ],
  },
  {
    version: "5.29.0",
    date: "27/03/2026",
    highlight: "Correção crítica: nomes de alunos nas listas de pendentes",
    changes: [
      {
        type: "fix",
        text: "Corrigido bug crítico onde todos os alunos apareciam com o nome do professor logado nas listas de 'Quem fez / Quem falta' de Exercícios, Provas e Atividades de Sala",
      },
      {
        type: "fix",
        text: "Corrigido JOIN incorreto nas procedures: agora usa subjectEnrollments.studentId → students.id e exibe students.fullName (nome real do aluno)",
      },
      {
        type: "fix",
        text: "Contagens de pendentes/concluídos agora refletem corretamente os alunos matriculados na disciplina",
      },
    ],
  },
  {
    version: "5.28.0",
    date: "27/03/2026",
    highlight: "Página de Novidades atualizada com versões v5.25 a v5.27",
    changes: [
      {
        type: "improvement",
        text: "Changelog atualizado com as versões v5.25.0, v5.26.0 e v5.27.0",
      },
    ],
  },
  {
    version: "5.27.0",
    date: "27/03/2026",
    highlight: "Quem fez / quem falta em Provas e Atividades de Sala",
    changes: [
      {
        type: "feature",
        text: "Provas (Banco de Provas): botão 'Alunos' em cada card mostra modal com duas colunas — Faltam fazer (laranja) e Concluíram (verde) com nome de cada aluno",
      },
      {
        type: "feature",
        text: "Atividades de Sala: botão 'Alunos (X/Y enviaram)' com modal de participação, mostrando quem enviou e quem ainda não enviou",
      },
      {
        type: "improvement",
        text: "Procedures backend dedicadas para calcular pendentes/concluídos por prova e por atividade, com junção correta entre alunos matriculados e submissões",
      },
    ],
  },
  {
    version: "5.26.0",
    date: "27/03/2026",
    highlight: "Alunos pendentes nos Exercícios do Banco de Provas",
    changes: [
      {
        type: "feature",
        text: "Modal de edição de exercício agora abre na aba 'Alunos': mostra quantos faltam fazer (laranja), quantos concluíram (verde) e o total matriculado",
      },
      {
        type: "improvement",
        text: "Listas ordenadas alfabeticamente com scroll independente — aba Configurações (tentativas + reset) continua disponível na segunda aba",
      },
    ],
  },
  {
    version: "5.25.0",
    date: "27/03/2026",
    highlight: "Página de Novidades completa com todas as versões",
    changes: [
      {
        type: "improvement",
        text: "Página Novidades atualizada com versões v5.21.0 a v5.24.0 que estavam faltando no changelog",
      },
      {
        type: "improvement",
        text: "Badge 'Mais recente' atualizado para apontar sempre para a versão mais nova disponível",
      },
    ],
  },
  {
    version: "5.24.0",
    date: "27/03/2026",
    highlight: "Correção crítica: notificações duplicadas no sino do professor",
    changes: [
      {
        type: "fix",
        text: "Bug crítico corrigido: notificações de prova, exercício, atividade de trilha e avisos usavam o ID interno do aluno (studentId) como destinatário — o sino do professor exibia notificações destinadas aos alunos",
      },
      {
        type: "fix",
        text: "Todas as notificações agora usam corretamente o userId da conta de usuário do aluno — professor não vê mais notificações dos alunos no seu sino",
      },
      {
        type: "fix",
        text: "Alunos sem conta de usuário vinculada são ignorados no envio de notificações (evita erros silenciosos no banco)",
      },
    ],
  },
  {
    version: "5.23.0",
    date: "27/03/2026",
    highlight: "Configurações de IA redesenhada com padrão de layout do sistema",
    changes: [
      {
        type: "improvement",
        text: "Página Configurações de IA completamente redesenhada: layout com Sidebar + PageWrapper sem abas, igual ao padrão do restante do sistema",
      },
      {
        type: "improvement",
        text: "Conteúdo organizado em cards lado a lado: Provedor e Modelo (esquerda) + Chaves de API (direita), seguido de Uso & Gastos com gráfico e Histórico de Chamadas",
      },
      {
        type: "improvement",
        text: "Header com título, botão Voltar ao Dashboard e badges de status do provedor ativo e chave API configurada",
      },
    ],
  },
  {
    version: "5.22.0",
    date: "27/03/2026",
    highlight: "UX dos modais aprimorada para mobile e indicador de scroll",
    changes: [
      {
        type: "improvement",
        text: "Cards de tipo nos modais de Criar Exercícios e Criar Prova reduzidos para mobile: min-h-[80px], padding p-3 sm:p-5, ícone h-6 w-6 sm:h-8 sm:w-8",
      },
      {
        type: "improvement",
        text: "Todos os modais com conteúdo rolável exibem gradiente fade-out na borda inferior indicando que há mais conteúdo abaixo — desaparece ao chegar no final",
      },
    ],
  },
  {
    version: "5.21.0",
    date: "27/03/2026",
    highlight: "Página Novidades atualizada com todas as versões",
    changes: [
      {
        type: "improvement",
        text: "Página Novidades atualizada com as versões v5.14.0 a v5.20.0, documentando todas as melhorias implementadas desde a versão que estava na VPS",
      },
    ],
  },
  {
    version: "5.20.0",
    date: "27/03/2026",
    highlight: "Correção global de modais em resoluções grandes",
    changes: [
      {
        type: "fix",
        text: "Todos os modais do sistema agora têm altura máxima (90vh) e scroll automático — botões de ação nunca ficam cortados em telas grandes ou ultrawide",
      },
      {
        type: "fix",
        text: "Modal Criar Exercícios e Criar Prova: conteúdo do passo de configuração rola internamente, mantendo os botões Gerar/Próximo sempre visíveis",
      },
    ],
  },
  {
    version: "5.19.0",
    date: "27/03/2026",
    highlight: "Notificações automáticas para alunos e correção do sino",
    changes: [
      {
        type: "fix",
        text: "Clique em notificações de prova/exercício no painel do professor não redireciona mais para o login do aluno — o painel fecha normalmente",
      },
      {
        type: "feature",
        text: "Alunos recebem notificação automática '📚 Novos Exercícios Disponíveis' quando exercícios de módulo/trilha são gerados com IA",
      },
      {
        type: "feature",
        text: "Alunos recebem notificação automática '📋 Nova Atividade Disponível' (com prazo, quando informado) ao criar atividade em tópico da trilha",
      },
    ],
  },
  {
    version: "5.18.0",
    date: "27/03/2026",
    highlight: "Gráfico de uso diário de IA e feature tagging automático",
    changes: [
      {
        type: "feature",
        text: "Configurações de IA — aba Uso & Gastos: gráfico de linha interativo (Chart.js) com duplo eixo mostrando chamadas e tokens consumidos nos últimos 30 dias",
      },
      {
        type: "feature",
        text: "Feature tagging automático: todas as 18 chamadas de IA do sistema registram a funcionalidade utilizada (Gerar Exercício, Gerar Prova, Mapa Mental, Infográfico, Plano de Aula, etc.)",
      },
      {
        type: "improvement",
        text: "Painel de uso exibe nomes em português para cada funcionalidade de IA, facilitando a identificação do consumo por recurso",
      },
    ],
  },
  {
    version: "5.17.0",
    date: "27/03/2026",
    highlight: "Painel de Configurações de IA com monitoramento de gastos",
    changes: [
      {
        type: "feature",
        text: "Nova seção Administração → Configurações de IA: selecione provedor (Groq/Gemini/Manus), modelo, insira chave de API e teste a conexão com um clique",
      },
      {
        type: "feature",
        text: "Aba Uso & Gastos: dashboard com total de chamadas, tokens consumidos (entrada/saída), custo estimado em USD e taxa de sucesso — filtros por 7/30/90 dias",
      },
      {
        type: "feature",
        text: "Aba Histórico: tabela com as últimas 20 chamadas da API mostrando provedor, modelo, funcionalidade, tokens e status",
      },
      {
        type: "improvement",
        text: "Logging automático de todas as chamadas ao invokeLLM sem impacto no fluxo principal",
      },
    ],
  },
  {
    version: "5.16.0",
    date: "26/03/2026",
    highlight: "Correções de UX no portal do professor",
    changes: [
      {
        type: "fix",
        text: "Notificações de prova/exercício: clique não redireciona mais professores para área restrita do aluno",
      },
      {
        type: "improvement",
        text: "Melhorias de estabilidade e performance no carregamento de páginas do portal do professor",
      },
    ],
  },
  {
    version: "5.14.0",
    date: "26/03/2026",
    highlight: "Correções de notas e UX do portal do aluno",
    changes: [
      {
        type: "fix",
        text: "Painel de Notas: exibição de turmas reais corrigida em todos os filtros e cabeçalhos de tabela",
      },
      {
        type: "improvement",
        text: "Portal do aluno: identidade visual padronizada em todas as páginas (exercícios, trilha, avisos)",
      },
    ],
  },
  {
    version: "5.13.0",
    date: "26/03/2026",
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
