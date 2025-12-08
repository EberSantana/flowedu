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

## Sistema de Convites por E-mail
- [x] Criar tabela de convites no banco de dados
- [x] Adicionar campos: email, token, role, status, createdBy, expiresAt
- [x] Implementar geração de tokens únicos e seguros
- [x] Criar rotas tRPC para administradores gerenciarem convites
- [x] Implementar envio de notificação com link de convite (via notifyOwner)
- [x] Criar interface administrativa para enviar convites
- [x] Implementar listagem de convites (pendentes, aceitos, expirados, cancelados)
- [x] Criar página pública de aceite de convite
- [x] Implementar validação de token e criação automática de conta
- [x] Adicionar opção de reenviar convite
- [x] Adicionar opção de cancelar convite pendente
- [x] Criar testes automatizados para sistema de convites (11 testes passando)
- [x] Adicionar botão de Convites no Dashboard para administradores
- [x] Implementar estatísticas de convites (pendentes, aceitos, total)
- [x] Adicionar badges visuais de status (pendente, aceito, expirado, cancelado)
- [x] Implementar cópia de link de convite para área de transferência
