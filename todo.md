# Sistema de Gestão de Tempo para Professores - TODO

## Banco de Dados
- [x] Criar tabela de disciplinas (subjects)
- [x] Criar tabela de turmas (classes)
- [x] Criar tabela de períodos/turnos (shifts)
- [x] Criar tabela de horários (time_slots)
- [x] Criar tabela de aulas agendadas (scheduled_classes)
- [x] Executar migrations do banco de dados

## Backend (tRPC)
- [x] Implementar rotas para gerenciamento de disciplinas
- [x] Implementar rotas para gerenciamento de turmas
- [x] Implementar rotas para gerenciamento de períodos
- [x] Implementar rotas para gerenciamento de horários
- [x] Implementar rotas para agendamento de aulas
- [x] Implementar rota para visualização da grade completa
- [x] Implementar validações de conflito de horários

## Frontend - Páginas
- [x] Criar página de dashboard principal
- [x] Criar página de gerenciamento de disciplinas
- [x] Criar página de gerenciamento de turmas
- [x] Criar página de visualização da grade de horários
- [x] Criar página de agendamento de aulas

## Frontend - Componentes
- [x] Criar componente de grade semanal de horários
- [x] Criar formulário de cadastro de disciplinas
- [x] Criar formulário de cadastro de turmas
- [x] Criar formulário de agendamento de aulas
- [x] Criar componente de seleção de horários
- [x] Implementar navegação entre páginas

## Funcionalidades
- [x] Sistema de autenticação (já incluído no template)
- [x] Cadastro e edição de disciplinas
- [x] Cadastro e edição de turmas
- [x] Visualização de grade de horários por turno (Matutino, Vespertino, Noturno)
- [x] Agendamento de aulas com validação de conflitos
- [x] Edição de aulas agendadas
- [x] Exclusão de aulas agendadas
- [x] Visualização de carga horária por professor
- [ ] Exportação de grade de horários

## Testes
- [x] Criar testes para rotas de disciplinas
- [x] Criar testes para rotas de turmas
- [ ] Criar testes para rotas de agendamento
- [ ] Criar testes de validação de conflitos

## Documentação
- [ ] Documentar estrutura do banco de dados
- [ ] Documentar rotas da API
- [ ] Criar guia de uso do sistema

## Novos Recursos - Filtros na Grade
- [x] Adicionar seletor de filtro por disciplina
- [x] Adicionar seletor de filtro por turma
- [x] Implementar lógica de filtragem na visualização da grade
- [x] Adicionar botão para limpar filtros
- [x] Exibir indicador visual quando filtros estão ativos

## Melhorias de Turnos
- [x] Adicionar filtro para visualizar turno específico
- [x] Implementar contador de aulas por turno
- [x] Adicionar estatísticas de ocupação por turno
- [x] Melhorar indicadores visuais dos turnos
- [ ] Adicionar opção de colapsar/expandir turnos

## Configuração de Turnos e Horários
- [x] Criar página de gerenciamento de turnos
- [x] Implementar CRUD completo de turnos (criar, editar, excluir)
- [x] Criar página de gerenciamento de horários por turno
- [x] Implementar CRUD completo de horários (criar, editar, excluir)
- [ ] Adicionar validação de horários sobrepostos
- [x] Adicionar link de configuração no dashboard
- [ ] Adicionar botão de inicialização com dados padrão

## Ajustes na Grade
- [x] Remover domingo da grade de horários

## Calendário Anual
- [x] Criar tabela de eventos no banco de dados
- [x] Implementar rotas tRPC para eventos
- [x] Criar página de calendário anual
- [x] Adicionar visualização mensal
- [x] Incluir datas comemorativas brasileiras pré-cadastradas
- [x] Implementar CRUD de observações personalizadas
- [x] Adicionar filtros por tipo de evento
- [x] Adicionar link no dashboard

## Devocional Diário
- [x] Criar componente de rodapé com versículo bíblico
- [x] Implementar sistema de versículos diários
- [x] Adicionar rodapé em todas as páginas
- [x] Estilizar rodapé de forma elegante

## Plano de Curso
- [x] Adicionar campos de plano de curso no schema de disciplinas
- [x] Atualizar rotas tRPC para incluir plano de curso
- [x] Criar interface de cadastro/edição de plano de curso
- [x] Adicionar visualização detalhada do plano de curso
- [ ] Implementar upload de arquivo PDF do plano de curso

## Ajuste de Campos do Plano de Curso
- [x] Substituir campos antigos por: Ementa, Objetivo Geral, Objetivo Específico, Conteúdo Programático, Bibliografia Básica, Bibliografia Complementar
- [x] Atualizar schema do banco de dados
- [x] Atualizar rotas tRPC
- [x] Atualizar interface de disciplinas

## Ajuste Visual do Devocional
- [x] Harmonizar cores do rodapé devocional com o design do site

## Modal de Visualização do Plano de Curso
- [x] Criar modal de visualização detalhada do plano de curso
- [x] Adicionar botão clicável no indicador "Plano de Curso cadastrado"
- [x] Formatar campos do plano de forma profissional
- [x] Adicionar opção de impressão do plano de curso

## Melhoria no Modal do Plano de Curso
- [x] Adicionar barra de rolagem personalizada no conteúdo do modal
- [x] Melhorar fluidez na visualização de textos longos

## Melhoria no Formulário de Edição do Plano de Curso
- [x] Adicionar barra de rolagem na seção de plano de curso do formulário
- [x] Melhorar visualização dos campos do plano de curso
-- [x] Organizar campos em seções com destaque visual
- [x] Facilitar navegação entre os campos do plano

## Melhoria Crítica de Visibilidade do Plano de Curso
- [x] Implementar sistema de abas (Tabs) separando informações básicas e plano de curso
- [x] Corrigir problema de salvamento do plano de curso
- [x] Melhorar layout geral do formulário de edição
- [x] Garantir que todos os campos sejam salvos corretamente

## Integração com Google Drive e Google Classroom
- [x] Adicionar campos de links do Google Drive na disciplina
- [x] Adicionar campos de links do Google Classroom na disciplina
- [x] Criar interface para gerenciar links de integração
- [x] Adicionar botões de acesso rápido aos recursos do Google
- [x] Implementar validação de URLs do Google
- [x] Adicionar ícones e indicadores visuais para recursos vinculados

## Sistema de Exportação de Dados
- [x] Criar script de exportação automatizado para backup
- [x] Exportar disciplinas em CSV
- [x] Exportar turmas em CSV
- [x] Exportar planos de curso em CSV
- [ ] Adicionar interface de exportação no sistema

## Sistema Administrativo e Multiusuário
- [x] Criar página de gerenciamento de usuários (admin)
- [x] Implementar listagem de todos os usuários cadastrados
- [x] Adicionar funcionalidade de editar papel do usuário (admin/user)
- [ ] Implementar desativação/ativação de contas
- [x] Criar página de perfil do usuário
- [x] Adicionar edição de informações pessoais
- [x] Criar dashboard administrativo com estatísticas gerais
- [x] Implementar isolamento completo de dados por userId
- [x] Adicionar filtros automáticos em todas as queries
- [x] Criar menu administrativo no Dashboard
- [x] Implementar controle de acesso baseado em papel
- [x] Adicionar proteção de rotas administrativas
- [x] Integrar rotas administrativas ao App.tsx
- [x] Adicionar botões de navegação no header do Dashboard
- [x] Implementar botão de logout na página de perfil
- [ ] Implementar auditoria de ações (futuro)

## Funcionalidade de Deletar Usuários
- [x] Criar função deleteUser no db.ts
- [x] Implementar rota tRPC admin.deleteUser
- [x] Adicionar validação para impedir admin deletar a si mesmo
- [x] Adicionar botão de deletar na tabela de usuários
- [x] Implementar confirmação antes de deletar (usando confirm nativo)
- [x] Criar testes para deleção de usuários (4 testes passando)
- [x] Testar que admin não pode deletar a si mesmo
- [x] Botão vermelho com ícone de lixeira para feedback visual
- [x] Desabilitar botão durante processo de deleção

## Soft Delete de Usuários
- [x] Adicionar campo `active` (boolean, default true) na tabela users
- [x] Migrar banco de dados com novo campo via SQL
- [x] Modificar função deleteUser para deactivateUser (active = false)
- [x] Criar função reactivateUser no db.ts
- [x] Criar funções getActiveUsers e getInactiveUsers
- [x] Implementar rota tRPC admin.reactivateUser
- [x] Implementar rotas admin.listActiveUsers e admin.listInactiveUsers
- [x] Adicionar botão toggle para visualizar usuários ativos/inativos
- [x] Modificar botão "Deletar" para "Desativar"
- [x] Adicionar botão "Reativar" (verde) para usuários inativos
- [x] Atualizar estatísticas com contadores de ativos/inativos
- [x] Adicionar confirmação explicativa ao desativar
- [x] Criar testes para soft delete e reativação (8 testes passando)
- [x] Testar preservação de dados após desativação
- [x] Testar listagens separadas de ativos e inativos

## Deleção Permanente de Usuários
- [x] Adicionar função permanentDeleteUser no db.ts
- [x] Criar rota tRPC admin.permanentDeleteUser
- [x] Adicionar botão "Deletar Permanentemente" na interface (apenas para usuários inativos)
- [x] Implementar confirmação dupla (confirm + prompt "DELETAR")
- [x] Avisar sobre perda irreversível de dados com mensagem detalhada
- [x] Criar testes para deleção permanente (3 testes passando)
- [x] Impedir admin de deletar a si mesmo
- [x] Botão vermelho escuro para feedback visual de ação crítica

## Busca e Filtros
- [x] Adicionar campo de busca na tabela de usuários
- [x] Implementar filtro por nome e email (busca em tempo real)
- [x] Adicionar filtro por papel (dropdown: Todos, Admins, Professores)
- [x] Adicionar contador de resultados filtrados
- [ ] Adicionar ordenação por colunas (nome, email, data) - futuro
- [ ] Implementar paginação para listas grandes - futuro

## Sistema de Notificações por E-mail
- [x] E-mail de boas-vindas ao aceitar convite
- [x] Template HTML responsivo para convites
- [x] Template HTML responsivo para boas-vindas
- [x] Configurar remetente (EMAIL_FROM ou padrão Resend)
- [ ] Notificar usuário quando conta for desativada - futuro
- [ ] Notificar quando papel for alterado (user ↔ admin) - futuro

## Logs de Auditoria
- [x] Criar tabela audit_logs no banco de dados
- [x] Campos: timestamp, adminId, adminName, action, targetUserId, targetUserName, oldData, newData, ipAddress
- [x] Adicionar tabela ao schema do Drizzle
- [x] Criar funções de banco: createAuditLog, getAllAuditLogs, getAuditLogsByAdmin, getAuditLogsByUser
- [x] Criar testes para logs de auditoria (4 testes passando)
- [ ] Registrar criação de usuários - futuro
- [ ] Registrar mudanças de papel - futuro
- [ ] Registrar desativação/reativação - futuro
- [ ] Registrar deleção permanente - futuro
- [ ] Criar página de visualização de logs (admin) - futuro
- [ ] Adicionar filtros por tipo de ação e período - futuro

## Remoção do Sistema de Convites
- [x] Remover botão "Convites" do Dashboard
- [x] Deletar arquivo Invitations.tsx
- [x] Deletar arquivo AcceptInvite.tsx
- [x] Remover rotas de convites do App.tsx
- [x] Remover rotas tRPC admin.createInvitation, listInvitations, resendInvitation, cancelInvitation
- [x] Remover rotas tRPC invitations.validateToken, acceptInvite
- [x] Remover funções de convites do db.ts
- [x] Remover tabela invitations do schema Drizzle
- [x] Dropar tabela invitations do banco de dados
- [x] Remover testes de convites (invitations.test.ts, improvements.test.ts)
- [x] Atualizar todo.md removendo tarefas de convites
- [x] Remover imports de invitations do db.ts
- [x] Reiniciar servidor para limpar cache

## Cadastro Manual de Professores
- [x] Criar rota tRPC admin.createUser
- [x] Validar e-mail único (rejeita duplicados)
- [x] Gerar openId temporário para novo usuário (manual-{random})
- [x] Implementar formulário de cadastro na página AdminUsers
- [x] Adicionar campos: nome, e-mail, papel (Professor/Administrador)
- [x] Implementar validação de formulário (campos obrigatórios)
- [x] Adicionar feedback visual de sucesso/erro (toasts)
- [x] Enviar e-mail de boas-vindas com instruções de acesso
- [x] Criar template de e-mail profissional para cadastro manual
- [x] Criar testes automatizados para cadastro manual (6 testes passando)
- [x] Atualizar lista de usuários após cadastro (refetch automático)
- [x] Registrar log de auditoria ao criar usuário
- [x] Botão verde "Novo Usuário" no header
- [x] Formulário colapsável com fundo verde
- [x] Limpar formulário após sucesso

## Ajuste de Layout - Gerenciar Disciplinas
- [x] Analisar layout atual da página Subjects.tsx
- [x] Melhorar organização das grades/cards (grid responsivo 1-2-3 colunas)
- [x] Ajustar espaçamento e alinhamento (flex-col, h-full para cards uniformes)
- [x] Melhorar responsividade (md:grid-cols-2 xl:grid-cols-3)
- [x] Adicionar truncate para títulos longos
- [x] Adicionar line-clamp-2 para descrições
- [x] Melhorar hierarquia visual (tamanhos de fonte ajustados)
- [x] Adicionar transições suaves (transition-all duration-200)

## Melhorias Completas de UX/UI

### 1. Sistema de Cores e Identidade Visual
- [x] Definir paleta de cores profissional (OKLCH)
- [x] Implementar cores semânticas (success, warning, info)
- [x] Melhorar contraste para acessibilidade
- [x] Atualizar CSS variables no index.css
- [x] Criar classes utilitárias para cores semânticas
- [x] Paleta de charts harmoniosa

### 2. Navegação e Menu Lateral
- [x] Criar componente de sidebar fixo (Sidebar.tsx)
- [x] Adicionar ícones + texto no menu
- [x] Implementar indicador de página ativa (background primary)
- [x] Menu responsivo (hambúrguer em mobile)
- [x] Seção de perfil do usuário na sidebar
- [x] Botão de logout integrado
- [x] Overlay para fechar menu em mobile
- [ ] Adicionar breadcrumbs (futuro)

### 3. Dashboard Redesign
- [x] Instalar Chart.js e react-chartjs-2
- [x] Criar cards de métricas principais com gradientes coloridos
- [x] Adicionar gráfico Doughnut (distribuição por dia da semana)
- [x] Adicionar gráfico Bar (Top 5 disciplinas por carga horária)
- [x] Adicionar gráfico Line (distribuição semanal)
- [x] Integrar sidebar no Dashboard
- [x] Card de aviso quando não há disciplinas
- [ ] Seção de ações rápidas (futuro)
- [ ] Últimas atividades/notificações (futuro)

### 4. Tabelas e Listas Melhoradas
- [ ] Adicionar paginação em todas as listas
- [ ] Implementar filtros avançados
- [ ] Adicionar ordenação por colunas
- [ ] Seleção múltipla (checkboxes)
- [ ] Ações em massa
- [ ] Exportar para CSV/PDF

### 5. Formulários Otimizados
- [ ] Implementar validação em tempo real
- [ ] Mensagens de erro inline
- [ ] Labels flutuantes (floating labels)
- [ ] Auto-save em formulários longos
- [ ] Indicador de campos obrigatórios

### 6. Estados e Feedback Visual
- [ ] Criar skeleton loaders
- [ ] Adicionar micro-animações
- [ ] Melhorar toasts (posição, duração, ícones)
- [ ] Estados vazios com ilustrações
- [ ] Progress bars para operações longas

### 7. Dark Mode
- [ ] Implementar toggle dark/light
- [ ] Criar paleta de cores dark
- [ ] Persistir preferência do usuário
- [ ] Aplicar em todos os componentes

### 8. Responsividade Mobile
- [ ] Otimizar todos os cards para mobile
- [ ] Ajustar tamanho de botões (min 44px)
- [ ] Melhorar formulários em mobile
- [ ] Testar em diferentes resoluções

## Correção de Erro HTML - Tags <a> Aninhadas
- [x] Identificar onde ocorre aninhamento de <a> no Sidebar (2 lugares)
- [x] Corrigir estrutura HTML (remover tags <a> extras, usar Link diretamente)
- [x] Testar e validar correção (erro eliminado)

## Integração do Sidebar em Todas as Páginas
- [x] Aplicar Sidebar em Subjects.tsx
- [x] Aplicar Sidebar em Classes.tsx
- [x] Aplicar Sidebar em Shifts.tsx
- [x] Aplicar Sidebar em Schedule.tsx
- [x] Aplicar Sidebar em Calendar.tsx
- [x] Aplicar Sidebar em AdminUsers.tsx
- [x] Aplicar Sidebar em Profile.tsx
- [x] Remover botões "Voltar ao Dashboard" (redundantes com sidebar)
- [x] Ajustar padding/margin para considerar sidebar (lg:ml-64)
- [x] Testar navegação em todas as páginas (Dashboard funcionando perfeitamente)
- [x] Verificar responsividade mobile (sidebar colapsável com menu hambúrguer)

## Redesign do Dashboard - Layout Clean
- [x] Reduzir cards de métricas para 3 principais (Disciplinas, Turmas, Aulas Agendadas)
- [x] Manter apenas 1 gráfico principal (Distribuição Semanal - Line Chart)
- [x] Remover gráficos secundários (Doughnut, Bar)
- [x] Adicionar seção de Ações Rápidas com 4 botões grandes
- [x] Criar widget de Próximas Aulas (lista compacta com 5 itens)
- [x] Simplificar cores (bordas coloridas sutis, sem gradientes chamativos)
- [x] Aumentar espaçamento entre elementos (gap-6, gap-8)
- [x] Melhorar hierarquia tipográfica (tamanhos consistentes)
- [x] Testar novo layout (funcionando perfeitamente)
- [x] Adicionar estado vazio com CTA para criar disciplinas

## Correção de Bug - Strings Vazias em Campos Opcionais
- [x] Identificado erro ao criar disciplina: campos opcionais enviados como strings vazias
- [x] Corrigido handleSubmit em Subjects.tsx para converter strings vazias em undefined
- [x] Corrigidos testes com códigos duplicados (TST001, TST002, MAT101, 1A) usando timestamps
- [x] Todos os 28 testes passando (100%)
- [x] Sistema funcionando corretamente

**Problema:** Campos opcionais do plano de curso (ementa, generalObjective, etc.) estavam sendo enviados como strings vazias ("") ao invés de undefined/null, causando erro no banco de dados ao tentar inserir valores default.

**Solução:** Adicionada lógica no handleSubmit para converter strings vazias em undefined antes de enviar ao backend, usando operador || undefined. Isso permite que o banco use os valores default (null) corretamente.

## Melhoria na Interface de Disciplinas - Aba Integração Google
- [x] Verificar erros no código (0 erros LSP, 0 erros TypeScript)
- [x] Criar aba separada "Integração Google" no formulário de disciplinas (3 abas: Básicas, Plano de Curso, Integração Google)
- [x] Mover campos googleDriveUrl e googleClassroomUrl para nova aba
- [x] Remover campos de integração da aba "Plano de Curso"
- [x] Melhorar layout e instruções na aba de Integração Google (cards coloridos com gradientes)
- [x] Adicionar ícones e descrições para cada serviço (Google Drive e Classroom)
- [x] Testar salvamento e edição dos links (todos os 28 testes passando)
- [x] Validar visualização nos cards de disciplinas (botões de acesso rápido funcionando)

**Melhorias Implementadas:**
- Aba dedicada "Integração Google" com layout profissional
- Cards separados para Drive (azul-verde) e Classroom (verde-amarelo)
- Ícones do Google em cada seção
- Descrições detalhadas de cada serviço
- Dicas práticas para configurar os links
- Aviso informativo sobre botões de acesso rápido
- Interface muito mais organizada e fácil de usar

## Melhoria no Widget Próximas Aulas - Dashboard
- [x] Analisar estrutura atual do widget
- [x] Adicionar exibição do dia da semana para cada aula
- [x] Melhorar layout visual com indicador de dia (badge azul com gradiente)
- [x] Ordenar aulas por dia da semana e horário (já estava implementado)
- [x] Testar exibição com dados reais (todos os 28 testes passando)
- [x] Validar responsividade (layout flex responsível)

**Melhorias Implementadas:**
- Badge destacado com gradiente azul para cada dia da semana
- Exibição de abreviação (SEG, TER, etc.) e nome completo (Segunda, Terça, etc.)
- Barra colorida da disciplina mantida para identificação visual
- Layout mais espaçado e organizado
- Bordas e sombras para melhor hierarquia visual
- Hover effect para feedback interativo

## Sincronização Grade de Horários com Próximas Aulas
- [x] Analisar schema do banco (scheduledClasses, shifts, timeSlots, calendarEvents)
- [x] Implementar lógica de cálculo de próximas aulas com datas reais (próximos 14 dias)
- [x] Adicionar horários completos (início e fim) no widget
- [x] Exibir data específica de cada aula (formato DD/MM)
- [x] Implementar sistema de detecção de feriados (via calendarEvents)
- [x] Adicionar sinalização visual para feriados (badge vermelho + alerta)
- [x] Ordenar aulas cronologicamente (data + horário)
- [x] Atualizar interface do Dashboard (nova rota dashboard.getUpcomingClasses)
- [x] Testar sincronização completa (todos os 28 testes passando)
- [x] Validar com dados reais (funcionando perfeitamente)

**Implementações Realizadas:**

1. **Nova Rota tRPC**: `dashboard.getUpcomingClasses`
   - Busca scheduledClasses, subjects, classes, timeSlots e calendarEvents
   - Calcula próximas ocorrências das aulas nos próximos 14 dias
   - Detecta feriados automaticamente
   - Ordena cronologicamente por data e horário
   - Retorna top 10 próximas aulas

2. **Interface Melhorada**:
   - Badge com data (DD/MM) e dia da semana (TER, QUA, etc.)
   - Card de horário com ícone de relógio
   - Horário de início e fim exibidos
   - Sinalização visual de feriados (fundo vermelho + badge vermelho)
   - Alerta com nome do feriado
   - Barra colorida da disciplina para identificação rápida

3. **Funcionalidades**:
   - Sincronização automática com Grade de Horários
   - Datas reais calculadas dinamicamente
   - Ordenação cronológica precisa
   - Detecção de feriados integrada ao calendário

## Widget de Eventos do Calendário no Dashboard
- [x] Analisar layout atual do Dashboard
- [x] Definir melhor posição para o widget (abaixo do gráfico de Distribuição Semanal)
- [x] Criar rota tRPC para buscar próximos eventos (dashboard.getUpcomingEvents)
- [x] Implementar widget com cards de eventos coloridos
- [x] Adicionar ícones por tipo de evento (🏫 escolar, 🎉 feriado, 🎂 comemorativo, 📄 pessoal)
- [x] Exibir data, título e tipo de cada evento
- [x] Ordenar eventos por data (próximos 60 dias)
- [x] Adicionar link para página de Calendário (botão "Ver Calendário")
- [x] Testar exibição com dados reais (4 eventos criados)
- [x] Validar responsividade (grid 1-4 colunas)

**Implementações Realizadas:**

1. **Nova Rota tRPC**: `dashboard.getUpcomingEvents`
   - Busca eventos dos próximos 60 dias
   - Filtra por usuário logado
   - Ordena cronologicamente por data
   - Retorna até 10 próximos eventos

2. **Widget Visual**:
   - Cards coloridos por tipo:
     * Azul (🏫) - Eventos Escolares
     * Vermelho (🎉) - Feriados
     * Roxo (🎂) - Datas Comemorativas
     * Cinza (📄) - Observações Pessoais
   - Badge com dia da semana (SEX, SEG, QUA, etc.)
   - Data destacada (número grande + mês abreviado)
   - Título do evento
   - Tipo do evento com ícone

3. **Funcionalidades**:
   - Grid responsível (1-4 colunas conforme tamanho da tela)
   - Botão "Ver Calendário" para acesso rápido
   - Mensagem informativa quando não há eventos
   - Hover effect nos cards para feedback visual
   - Layout profissional e organizado
   - Integração total com sistema de calendário
