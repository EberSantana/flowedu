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

## Correção de Erros de Testes
- [x] Corrigir teste admin.test.ts (TST001, TST002 duplicados)
- [x] Corrigir teste classes.test.ts (1A duplicado)
- [x] Corrigir teste subjects.test.ts (MAT101 duplicado)
- [x] Usar timestamps para garantir códigos únicos (Date.now())
- [x] Executar todos os testes para validar correções (28/28 passando)
