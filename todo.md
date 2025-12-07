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
