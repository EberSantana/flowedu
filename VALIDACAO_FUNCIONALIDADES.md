# Validação de Funcionalidades Críticas - FlowEdu

**Data:** 19/01/2026  
**Versão:** 68ff0523  
**Status:** Em validação

---

## Funcionalidades a Validar Antes do Deploy VPS

### 1. ✅ Agendamento de Aulas
**Status:** CORRIGIDO  
**Problema:** dayOfWeek incompatível entre frontend (1-7) e backend (0-6)  
**Solução:** Ajustado conversão no handleSubmit  
**Teste:** Agendar aula em qualquer dia da semana

---

### 2. Criação de Disciplinas
**Rota:** `/subjects`  
**Backend:** `subjects.create`  
**Campos obrigatórios:**
- name (string)
- code (string)
- description (opcional)
- color (opcional)

**Teste manual:**
1. Acessar /subjects
2. Clicar em "Nova Disciplina"
3. Preencher nome e código
4. Salvar
5. Verificar se aparece na lista

---

### 3. Criação de Turmas
**Rota:** `/classes`  
**Backend:** `classes.create`  
**Campos obrigatórios:**
- name (string)
- shift (enum: morning, afternoon, evening, night)

**Teste manual:**
1. Acessar /classes
2. Clicar em "Nova Turma"
3. Preencher nome e turno
4. Salvar
5. Verificar se aparece na lista

---

### 4. Criação de Exercícios
**Rota:** `/teacher-exercises`  
**Backend:** `teacherExercises.publish`  
**Campos obrigatórios:**
- moduleId (number)
- subjectId (number)
- title (string)
- exerciseData (JSON)
- totalQuestions (number)
- totalPoints (number)

**Teste manual:**
1. Acessar gerador de exercícios
2. Gerar exercício com IA
3. Publicar para alunos
4. Verificar se aparece na lista

---

### 5. Upload de Materiais
**Rota:** `/materials`  
**Backend:** `materials.create`  
**Campos obrigatórios:**
- topicId (number)
- title (string)
- type (enum)
- url (string - S3)

**Teste manual:**
1. Acessar tópico de uma disciplina
2. Clicar em "Adicionar Material"
3. Fazer upload de PDF
4. Verificar se aparece na lista

---

## Checklist de Validação

- [x] Agendamento de aulas (corrigido)
- [ ] Criação de disciplinas
- [ ] Criação de turmas
- [ ] Criação de exercícios
- [ ] Upload de materiais
- [ ] Login de professor
- [ ] Login de aluno
- [ ] Recuperação de senha

---

## Problemas Conhecidos

1. ✅ **Agendamento:** dayOfWeek incompatível - CORRIGIDO
2. ⚠️ **Performance:** Listas grandes sem paginação - OTIMIZADO (LIMIT 100)
3. ⚠️ **Cache:** Queries sem cache - CORRIGIDO (staleTime 5min)

---

## Recomendações

1. Testar todas as funcionalidades em ambiente de staging antes do deploy
2. Monitorar logs do servidor nas primeiras 24h após deploy
3. Ter backup do banco de dados antes do deploy
4. Configurar alertas de erro (Sentry, LogRocket)

