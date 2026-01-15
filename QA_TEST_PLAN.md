# Plano de Testes QA - FlowEdu

## Informações do Projeto
- **Aplicação:** FlowEdu - Sistema de Gestão Educacional
- **Versão:** 1.0.0
- **Data:** 14/01/2026
- **Analista de QA:** Manus AI

---

## Escopo dos Testes

### Módulos a serem testados:
1. **Portal do Professor**
   - Autenticação (Login, Cadastro, Recuperação de Senha)
   - Dashboard Principal
   - Gestão de Disciplinas
   - Gestão de Turmas
   - Gestão de Alunos
   - Grade de Horários
   - Calendário Anual
   - Exercícios e Avaliações
   - Configurações

2. **Portal do Aluno**
   - Autenticação (Login com código de acesso)
   - Dashboard do Aluno
   - Visualização de Exercícios
   - Trilha de Aprendizado
   - Avisos
   - Perfil

---

## Casos de Teste

### CT-001: Cadastro de Professor
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Usuário não autenticado |
| **Passos** | 1. Acessar /cadastro-professor<br>2. Preencher nome, email e senha<br>3. Clicar em "Criar Conta" |
| **Resultado Esperado** | Conta criada e redirecionamento para dashboard |
| **Status** | Pendente |

### CT-002: Login de Professor
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Professor cadastrado |
| **Passos** | 1. Acessar /login-professor<br>2. Preencher email e senha<br>3. Clicar em "Entrar" |
| **Resultado Esperado** | Login bem-sucedido e acesso ao dashboard |
| **Status** | Pendente |

### CT-003: Login com Credenciais Inválidas
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Nenhuma |
| **Passos** | 1. Acessar /login-professor<br>2. Preencher email e senha incorretos<br>3. Clicar em "Entrar" |
| **Resultado Esperado** | Mensagem de erro "Credenciais inválidas" |
| **Status** | Pendente |

### CT-004: Dashboard do Professor
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Professor autenticado |
| **Passos** | 1. Acessar /dashboard |
| **Resultado Esperado** | Dashboard carrega com estatísticas e menu lateral |
| **Status** | Pendente |

### CT-005: Criar Disciplina
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Professor autenticado |
| **Passos** | 1. Acessar /subjects<br>2. Clicar em "Nova Disciplina"<br>3. Preencher dados<br>4. Salvar |
| **Resultado Esperado** | Disciplina criada e listada |
| **Status** | Pendente |

### CT-006: Criar Turma
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Professor autenticado |
| **Passos** | 1. Acessar /classes<br>2. Clicar em "Nova Turma"<br>3. Preencher dados<br>4. Salvar |
| **Resultado Esperado** | Turma criada e listada |
| **Status** | Pendente |

### CT-007: Adicionar Aluno
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Professor autenticado, turma existente |
| **Passos** | 1. Acessar /students<br>2. Clicar em "Novo Aluno"<br>3. Preencher dados<br>4. Salvar |
| **Resultado Esperado** | Aluno criado com código de acesso gerado |
| **Status** | Pendente |

### CT-008: Login do Aluno
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Aluno cadastrado com código de acesso |
| **Passos** | 1. Acessar /student-login<br>2. Preencher código de acesso<br>3. Clicar em "Entrar" |
| **Resultado Esperado** | Login bem-sucedido e acesso ao portal do aluno |
| **Status** | Pendente |

### CT-009: Dashboard do Aluno
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Aluno autenticado |
| **Passos** | 1. Acessar /student/dashboard |
| **Resultado Esperado** | Dashboard carrega com disciplinas e navegação |
| **Status** | Pendente |

### CT-010: Visualizar Exercícios
| Campo | Valor |
|-------|-------|
| **Pré-condição** | Aluno autenticado, exercícios disponíveis |
| **Passos** | 1. Acessar /student-exercises<br>2. Selecionar exercício |
| **Resultado Esperado** | Lista de exercícios exibida corretamente |
| **Status** | Pendente |

---

## Bugs Encontrados

| ID | Severidade | Descrição | Status |
|----|------------|-----------|--------|
| BUG-001 | Crítico | - | - |

---

## Resumo da Execução

| Métrica | Valor |
|---------|-------|
| Total de Casos de Teste | 10+ |
| Executados | 0 |
| Passou | 0 |
| Falhou | 0 |
| Bloqueado | 0 |

---

## Observações

Este documento será atualizado conforme os testes forem executados.
