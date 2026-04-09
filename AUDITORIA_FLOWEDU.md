# Auditoria FlowEdu — Relatório Completo
**Data:** Abril 2026  
**Portais auditados:** Portal do Professor + Portal do Aluno

---

## 🔴 BUGS CRÍTICOS

### 1. Bug no TeacherGradePanel — `classId` recebe `selectedSubjectId` em vez de `selectedClassId`
**Arquivo:** `client/src/pages/TeacherGradePanel.tsx`, linha 74  
**Problema:** O parâmetro `classId` da query `getGradesByClass` está recebendo `selectedSubjectId` em vez de `selectedClassId`. Embora o backend trate isso como compatibilidade, o filtro por turma não funciona corretamente quando professor leciona a mesma disciplina para turmas diferentes.  
**Código atual:**
```ts
{ classId: selectedSubjectId!, subjectId: selectedSubjectId ?? undefined }
```
**Código correto:**
```ts
{ classId: selectedClassId!, subjectId: selectedSubjectId ?? undefined }
```

### 2. Rota `/student/mistake-notebook` sem página correspondente
**Arquivo:** `client/src/components/Sidebar.tsx`, linha 311  
**Problema:** O Sidebar do professor (seção de acesso rápido ao portal do aluno) tem um link para `/student/mistake-notebook` com o label "Caderno Inteligente IA", mas essa rota não existe no `App.tsx` e não há nenhuma página `StudentMistakeNotebook.tsx`. O link leva a uma página 404.

---

## 🟠 INCONSISTÊNCIAS DE LAYOUT (Portal do Aluno)

### 3. `text-white` em vez de `text-primary-foreground` no banner de 8 páginas
**Problema:** O padrão correto do portal do aluno usa `text-primary-foreground` para garantir contraste correto em todos os temas. 8 páginas ainda usam `text-white`, que pode ficar invisível em temas claros.  
**Páginas afetadas:**
- `StudentActivitiesPage.tsx`
- `StudentAnnouncements.tsx`
- `StudentAssessmentsPage.tsx`
- `StudentDoubts.tsx`
- `StudentExercises.tsx`
- `StudentGradeBook.tsx`
- `StudentLearningJournal.tsx`
- `StudentStudyMaterials.tsx`

### 4. `StudentGradeBook.tsx` sem `bg-gray-50` no conteúdo
**Arquivo:** `client/src/pages/StudentGradeBook.tsx`  
**Problema:** O conteúdo após o banner usa fundo padrão (`bg-background`) em vez de `bg-gray-50`, quebrando o padrão visual das demais páginas do portal do aluno.

### 5. `StudentExercises.tsx` sem `bg-gray-50` no conteúdo
**Arquivo:** `client/src/pages/StudentExercises.tsx`  
**Problema:** Mesmo problema — conteúdo usa `bg-background` em vez de `bg-gray-50`.

---

## 🟡 PROBLEMAS DE UX

### 6. `StudentLearningJournal` — sem botão de adicionar entrada quando já existem entradas
**Arquivo:** `client/src/pages/StudentLearningJournal.tsx`  
**Problema:** O botão "Adicionar Primeira Entrada" só aparece no estado vazio (empty state). Quando o aluno já tem entradas, não há nenhum botão visível para adicionar novas entradas. O `Dialog` existe mas não tem como ser aberto pelo usuário quando há entradas.  
**Solução:** Adicionar botão "+ Nova Entrada" no cabeçalho da lista de entradas ou como botão flutuante (FAB).

### 7. `StudentMyQuestions` e `StudentSubmitQuestion` — páginas órfãs (sem link no menu)
**Arquivos:** `client/src/pages/StudentMyQuestions.tsx`, `client/src/pages/StudentSubmitQuestion.tsx`  
**Problema:** Essas páginas existem e têm rotas no `App.tsx`, mas não aparecem em nenhum item do menu do `StudentLayout`. São acessíveis apenas por links internos entre si (StudentMyQuestions → StudentSubmitQuestion → StudentMyQuestions), mas o aluno não consegue navegar até elas pelo menu lateral.  
**Contexto:** `StudentDoubts.tsx` (no menu como "Dúvidas") usa o sistema `studentDoubts`, enquanto `StudentMyQuestions.tsx` usa o sistema `questions` (diferente). São dois sistemas de dúvidas distintos.

### 8. `StudentDoubts` — sem filtro por status (tab Pendentes/Respondidas)
**Arquivo:** `client/src/pages/StudentDoubts.tsx`  
**Problema:** O aluno vê todas as dúvidas misturadas, sem poder filtrar por status. O `TeacherDoubts.tsx` já tem abas "Pendentes" e "Respondidas", mas o portal do aluno não tem esse filtro.

### 9. `Questions.tsx` e `QuestionDetail.tsx` — sem Sidebar do professor
**Arquivos:** `client/src/pages/Questions.tsx`, `client/src/pages/QuestionDetail.tsx`  
**Problema:** Essas páginas não importam o componente `Sidebar` nem `PageWrapper`. Quando acessadas, o professor fica sem a barra lateral de navegação. São acessíveis via `CommandPalette` e por links internos.

### 10. `TimeSlots.tsx` — sem Sidebar do professor
**Arquivo:** `client/src/pages/TimeSlots.tsx`  
**Problema:** A página de gerenciamento de horários de turno não tem Sidebar. É acessada via `/shifts/:shiftId/timeslots` (link da página Shifts), mas sem navegação lateral.

---

## 🔵 PÁGINAS LEGADAS / NÃO UTILIZADAS

### 11. `MuralColaborativo.tsx` — página legada sem rota
**Arquivo:** `client/src/pages/MuralColaborativo.tsx`  
**Problema:** Essa página não está registrada no `App.tsx` e não é importada em nenhum lugar. É uma versão antiga do mural que foi substituída por `TeacherMural.tsx`. Pode ser removida com segurança.

### 12. `TeacherAddActivity.tsx` — componente sem rota nem importação
**Arquivo:** `client/src/pages/TeacherAddActivity.tsx`  
**Problema:** Exporta uma função `TeacherAddActivity` (não default export), não está registrada no `App.tsx` e não é importada em nenhum lugar. Parece ser código legado.

### 13. `StudentMyQuestions.tsx` e `StudentSubmitQuestion.tsx` — sistema de perguntas duplicado
**Problema:** Existe um sistema de "dúvidas" (`studentDoubts` router) acessível pelo menu, e um sistema de "perguntas" (`questions` router) sem acesso pelo menu. Os dois sistemas têm funcionalidades sobrepostas. Recomenda-se unificar ou remover o sistema legado.

---

## 🟢 OPORTUNIDADES DE MELHORIA

### 14. `StudentLearningJournal` — botão flutuante (FAB) para nova entrada
**Solução sugerida:** Adicionar um botão flutuante `+` fixo no canto inferior direito para abrir o dialog de nova entrada, seguindo o padrão de apps mobile.

### 15. `StudentDoubts` — filtro por status (Todas / Pendentes / Respondidas)
**Solução sugerida:** Adicionar abas ou chips de filtro para separar dúvidas por status, como já existe no portal do professor.

### 16. `StudentGradeBook` — indicador de "melhor tentativa"
**Solução sugerida:** Exibir badge ou tooltip indicando quantas tentativas foram feitas e que a nota exibida é a melhor delas.

### 17. Notificação ao aluno quando dúvida for respondida
**Solução sugerida:** Quando o professor responder uma dúvida via `TeacherDoubts`, disparar notificação push/in-app para o aluno correspondente.

### 18. Exportar boletim como PDF
**Solução sugerida:** Adicionar botão "Exportar PDF" no `StudentGradeBook` e no `TeacherGradePanel`.

### 19. `StudentDoubts` — badge de notificação quando há resposta nova
**Status:** Já implementado no `StudentLayout` via `unseenAnswersCount`. ✅

### 20. Toast "Nova versão disponível" quando Service Worker detectar atualização
**Solução sugerida:** No `main.tsx` ou `App.tsx`, escutar o evento `controllerchange` do Service Worker e exibir um toast com botão "Atualizar".

---

## 📋 RESUMO EXECUTIVO

| Categoria | Quantidade |
|-----------|-----------|
| 🔴 Bugs críticos | 2 |
| 🟠 Inconsistências de layout | 3 |
| 🟡 Problemas de UX | 5 |
| 🔵 Páginas legadas | 3 |
| 🟢 Melhorias sugeridas | 7 |
| **Total** | **20** |

### Prioridade de correção sugerida:
1. **Bug #1** — `classId` errado no `TeacherGradePanel` (afeta cálculo de notas)
2. **Bug #2** — Rota `/student/mistake-notebook` inexistente (link 404 no Sidebar)
3. **UX #6** — Botão de nova entrada no `StudentLearningJournal` quando já há entradas
4. **Layout #3** — `text-white` → `text-primary-foreground` nas 8 páginas
5. **Layout #4 e #5** — `bg-gray-50` faltando em `StudentGradeBook` e `StudentExercises`
6. **UX #9 e #10** — Adicionar Sidebar em `Questions.tsx`, `QuestionDetail.tsx` e `TimeSlots.tsx`
