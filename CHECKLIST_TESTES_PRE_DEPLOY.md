# ✅ Checklist de Testes Pré-Deploy - FlowEdu

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Tempo estimado:** 30-45 minutos  
**Link de teste:** https://3000-i09syy0mf1iqeiu2q96og-2ba66303.us1.manus.computer

---

## 📋 Como usar este checklist

1. Acesse o link de teste acima
2. Siga os testes na ordem apresentada
3. Marque ✅ quando o teste passar
4. Anote ❌ e descreva o problema se falhar
5. Teste tanto como **Professor** quanto como **Aluno**

---

## 🎯 Objetivo

Validar que todas as funcionalidades essenciais do FlowEdu estão funcionando corretamente antes de fazer o deploy no VPS de produção.

---

## 📊 Resumo de Progresso

| Categoria | Total de Testes | Concluídos |
|-----------|----------------|------------|
| Acesso e Autenticação | 6 | ___ / 6 |
| Portal do Professor | 15 | ___ / 15 |
| Portal do Aluno | 12 | ___ / 12 |
| Funcionalidades Gerais | 5 | ___ / 5 |
| **TOTAL** | **38** | **___ / 38** |

---

## 1️⃣ Acesso e Autenticação

### 1.1 Página Inicial

- [ ] **Teste 1.1.1:** Página inicial carrega corretamente
  - Acesse o link de teste
  - Verifique se aparece "FlowEdu - Onde a educação flui"
  - Verifique se aparecem dois cards: "Portal do Aluno" e "Portal do Professor"

- [ ] **Teste 1.1.2:** Design responsivo funciona
  - Redimensione a janela do navegador
  - Verifique se os cards se adaptam ao tamanho da tela
  - Teste em modo mobile (F12 → Toggle Device Toolbar)

### 1.2 Cadastro de Professor

- [ ] **Teste 1.2.1:** Cadastro de novo professor funciona
  - Clique em "Portal do Professor" → "Entrar com E-mail"
  - Clique em "Criar conta"
  - Preencha:
    - Nome completo: Seu Nome
    - E-mail: seuemail@teste.com
    - Senha: Senha123!
    - Confirmar senha: Senha123!
  - Clique em "Criar conta"
  - **Resultado esperado:** Conta criada e redirecionado para o dashboard

- [ ] **Teste 1.2.2:** Validação de senha funciona
  - Tente criar conta com senha fraca (ex: "123")
  - **Resultado esperado:** Mensagem de erro sobre senha fraca

### 1.3 Login de Professor

- [ ] **Teste 1.3.1:** Login com e-mail funciona
  - Faça logout (se estiver logado)
  - Clique em "Portal do Professor" → "Entrar com E-mail"
  - Digite e-mail e senha cadastrados
  - Clique em "Entrar"
  - **Resultado esperado:** Redirecionado para o dashboard do professor

- [ ] **Teste 1.3.2:** Login com credenciais inválidas falha
  - Tente fazer login com senha errada
  - **Resultado esperado:** Mensagem de erro "E-mail ou senha incorretos"

### 1.4 Recuperação de Senha

- [ ] **Teste 1.4.1:** Recuperação de senha funciona
  - Na tela de login, clique em "Esqueci minha senha"
  - Digite seu e-mail
  - Clique em "Enviar link de recuperação"
  - **Resultado esperado:** Mensagem de sucesso
  - **Nota:** O e-mail pode não chegar em ambiente de desenvolvimento, mas a funcionalidade deve processar sem erros

---

## 2️⃣ Portal do Professor

### 2.1 Dashboard

- [ ] **Teste 2.1.1:** Dashboard carrega corretamente
  - Após login, verifique se aparece o dashboard
  - Verifique se aparece menu lateral com: Início, Disciplinas, Turmas, Horários, etc.
  - Verifique se aparece seu nome no canto superior direito

- [ ] **Teste 2.1.2:** Estatísticas aparecem
  - Verifique se aparecem cards com números (disciplinas, turmas, alunos, etc.)
  - **Nota:** Podem estar zerados se for primeira vez

### 2.2 Gerenciamento de Disciplinas

- [ ] **Teste 2.2.1:** Criar disciplina funciona
  - No menu lateral, clique em "Disciplinas"
  - Clique em "Nova Disciplina" ou botão "+"
  - Preencha:
    - Nome: Matemática
    - Código: MAT01
    - Descrição: Disciplina de matemática básica
    - Cor: Escolha uma cor
  - Clique em "Salvar"
  - **Resultado esperado:** Disciplina aparece na lista

- [ ] **Teste 2.2.2:** Editar disciplina funciona
  - Clique no botão "Editar" (ícone de lápis) da disciplina criada
  - Altere o nome para "Matemática I"
  - Clique em "Salvar"
  - **Resultado esperado:** Nome atualizado na lista

- [ ] **Teste 2.2.3:** Adicionar ementa funciona
  - Edite a disciplina "Matemática I"
  - Vá na aba "Ementa"
  - Adicione tópicos:
    - Números inteiros
    - Frações
    - Equações
  - Defina carga horária: 40 horas
  - Clique em "Salvar"
  - **Resultado esperado:** Ementa salva com sucesso

- [ ] **Teste 2.2.4:** Integração Google (opcional)
  - Edite a disciplina
  - Vá na aba "Integração Google"
  - Adicione links (opcional):
    - Link Google Drive: https://drive.google.com/...
    - Link Google Classroom: https://classroom.google.com/...
  - Clique em "Salvar"
  - **Resultado esperado:** Links salvos (aparecem na visualização da disciplina)

### 2.3 Gerenciamento de Turmas

- [ ] **Teste 2.3.1:** Criar turma funciona
  - No menu lateral, clique em "Turmas"
  - Clique em "Nova Turma"
  - Preencha:
    - Nome: 1º Ano A
    - Ano letivo: 2026
    - Série: 1º Ano
    - Turno: Matutino
  - Clique em "Salvar"
  - **Resultado esperado:** Turma aparece na lista

- [ ] **Teste 2.3.2:** Vincular disciplina à turma funciona
  - Edite a turma "1º Ano A"
  - Vá na aba "Disciplinas"
  - Clique em "Adicionar Disciplina"
  - Selecione "Matemática I"
  - Clique em "Adicionar"
  - **Resultado esperado:** Disciplina vinculada à turma

- [ ] **Teste 2.3.3:** Adicionar alunos à turma funciona
  - Edite a turma "1º Ano A"
  - Vá na aba "Alunos"
  - Clique em "Adicionar Aluno"
  - Preencha dados de um aluno teste:
    - Nome: João Silva
    - E-mail: joao@teste.com
    - Matrícula: 2026001
  - Clique em "Adicionar"
  - **Resultado esperado:** Aluno aparece na lista da turma

### 2.4 Agendamento de Aulas

- [ ] **Teste 2.4.1:** Agendar aula funciona
  - No menu lateral, clique em "Horários" ou "Agenda"
  - Clique em "Agendar Aula"
  - Preencha:
    - Disciplina: Matemática I
    - Turma: 1º Ano A
    - Dia da semana: Segunda-feira
    - Horário: 08:00 - 09:00
    - Observações: Aula introdutória
  - Clique em "Agendar"
  - **Resultado esperado:** Aula aparece no calendário/grade

- [ ] **Teste 2.4.2:** Editar aula agendada funciona
  - Clique na aula agendada
  - Altere o horário para 09:00 - 10:00
  - Clique em "Salvar"
  - **Resultado esperado:** Horário atualizado

- [ ] **Teste 2.4.3:** Excluir aula agendada funciona
  - Clique na aula agendada
  - Clique em "Excluir"
  - Confirme a exclusão
  - **Resultado esperado:** Aula removida do calendário

### 2.5 Materiais Didáticos

- [ ] **Teste 2.5.1:** Upload de material funciona
  - No menu lateral, clique em "Materiais"
  - Clique em "Novo Material"
  - Preencha:
    - Título: Apostila de Matemática
    - Disciplina: Matemática I
    - Tipo: PDF
  - Faça upload de um arquivo PDF de teste (máximo 75MB)
  - Clique em "Salvar"
  - **Resultado esperado:** Material aparece na lista

- [ ] **Teste 2.5.2:** Download de material funciona
  - Clique no material "Apostila de Matemática"
  - Clique em "Baixar" ou no link do arquivo
  - **Resultado esperado:** Arquivo baixa corretamente

### 2.6 Exercícios e Avaliações

- [ ] **Teste 2.6.1:** Criar exercício funciona
  - No menu lateral, clique em "Exercícios"
  - Clique em "Novo Exercício"
  - Preencha:
    - Título: Lista de Frações
    - Disciplina: Matemática I
    - Tipo: Lista de exercícios
    - Descrição: Exercícios sobre frações
  - Adicione questões:
    - Questão 1: Quanto é 1/2 + 1/4?
    - Resposta: 3/4
  - Clique em "Salvar"
  - **Resultado esperado:** Exercício criado com sucesso

- [ ] **Teste 2.6.2:** Atribuir exercício a turma funciona
  - Edite o exercício "Lista de Frações"
  - Clique em "Atribuir a turma"
  - Selecione "1º Ano A"
  - Defina data de entrega: 7 dias a partir de hoje
  - Clique em "Atribuir"
  - **Resultado esperado:** Exercício atribuído à turma

---

## 3️⃣ Portal do Aluno

### 3.1 Acesso do Aluno

- [ ] **Teste 3.1.1:** Login de aluno funciona
  - Faça logout do portal do professor
  - Volte à página inicial
  - Clique em "Portal do Aluno" → "Entrar como Aluno"
  - Digite:
    - E-mail: joao@teste.com (aluno criado anteriormente)
    - Senha: (defina uma senha para o aluno ou use a senha padrão)
  - **Nota:** Se o aluno não tiver senha, use a funcionalidade de "Primeiro acesso" ou redefina a senha
  - **Resultado esperado:** Redirecionado para o dashboard do aluno

- [ ] **Teste 3.1.2:** Dashboard do aluno carrega
  - Verifique se aparece:
    - Nome do aluno no topo
    - Lista de disciplinas matriculadas
    - Próximas aulas
    - Exercícios pendentes

### 3.2 Visualização de Disciplinas

- [ ] **Teste 3.2.1:** Ver disciplinas matriculadas funciona
  - No menu do aluno, clique em "Minhas Disciplinas"
  - **Resultado esperado:** Aparece "Matemática I" (disciplina da turma 1º Ano A)

- [ ] **Teste 3.2.2:** Ver detalhes da disciplina funciona
  - Clique em "Matemática I"
  - Verifique se aparece:
    - Descrição da disciplina
    - Ementa (tópicos)
    - Materiais disponíveis
    - Exercícios atribuídos
  - **Resultado esperado:** Todas as informações aparecem corretamente

### 3.3 Materiais

- [ ] **Teste 3.3.1:** Ver materiais disponíveis funciona
  - No menu do aluno, clique em "Materiais"
  - **Resultado esperado:** Aparece "Apostila de Matemática"

- [ ] **Teste 3.3.2:** Baixar material funciona
  - Clique em "Apostila de Matemática"
  - Clique em "Baixar"
  - **Resultado esperado:** Arquivo baixa corretamente

### 3.4 Exercícios

- [ ] **Teste 3.4.1:** Ver exercícios atribuídos funciona
  - No menu do aluno, clique em "Exercícios"
  - **Resultado esperado:** Aparece "Lista de Frações" com status "Pendente"

- [ ] **Teste 3.4.2:** Responder exercício funciona
  - Clique em "Lista de Frações"
  - Responda a questão 1: Digite "3/4"
  - Clique em "Enviar resposta"
  - **Resultado esperado:** Resposta salva com sucesso

- [ ] **Teste 3.4.3:** Ver nota/feedback funciona (se implementado)
  - Após o professor corrigir (teste como professor)
  - Volte ao portal do aluno
  - Verifique se aparece a nota ou feedback
  - **Resultado esperado:** Nota/feedback visível

### 3.5 Horários e Agenda

- [ ] **Teste 3.5.1:** Ver grade de horários funciona
  - No menu do aluno, clique em "Horários" ou "Minha Agenda"
  - **Resultado esperado:** Aparece a aula de Matemática I agendada (Segunda 09:00-10:00)

- [ ] **Teste 3.5.2:** Ver próximas aulas funciona
  - No dashboard do aluno, verifique a seção "Próximas Aulas"
  - **Resultado esperado:** Aparece a próxima aula de Matemática I

### 3.6 Progresso e Estatísticas

- [ ] **Teste 3.6.1:** Ver progresso acadêmico funciona
  - No menu do aluno, clique em "Meu Progresso" ou "Estatísticas"
  - **Resultado esperado:** Aparecem gráficos ou indicadores de progresso

- [ ] **Teste 3.6.2:** Sistema de faixas funciona (se implementado)
  - Verifique se aparece a faixa atual do aluno (ex: Faixa Branca)
  - **Resultado esperado:** Faixa e progresso visíveis

### 3.7 Revisão Inteligente (Smart Review)

- [ ] **Teste 3.7.1:** Acessar revisão inteligente funciona
  - No menu do aluno, clique em "Revisão Inteligente" ou "Smart Review"
  - **Resultado esperado:** Página de revisão carrega

- [ ] **Teste 3.7.2:** Sistema de repetição espaçada funciona
  - Se houver questões erradas anteriormente, verifique se aparecem para revisão
  - **Resultado esperado:** Sistema sugere questões para revisar

---

## 4️⃣ Funcionalidades Gerais

### 4.1 Performance

- [ ] **Teste 4.1.1:** Páginas carregam rapidamente
  - Navegue entre diferentes páginas
  - **Resultado esperado:** Carregamento em menos de 2 segundos

- [ ] **Teste 4.1.2:** Sem erros no console
  - Abra o console do navegador (F12)
  - Navegue pelo sistema
  - **Resultado esperado:** Sem erros críticos em vermelho

### 4.2 Responsividade

- [ ] **Teste 4.2.1:** Design mobile funciona
  - Abra o DevTools (F12)
  - Ative "Toggle Device Toolbar" (Ctrl+Shift+M)
  - Teste em diferentes tamanhos: iPhone, iPad, etc.
  - **Resultado esperado:** Interface se adapta corretamente

### 4.3 Segurança

- [ ] **Teste 4.3.1:** Páginas protegidas exigem login
  - Faça logout
  - Tente acessar diretamente uma URL interna (ex: /dashboard)
  - **Resultado esperado:** Redirecionado para login

- [ ] **Teste 4.3.2:** Aluno não acessa portal do professor
  - Faça login como aluno
  - Tente acessar URL do professor (ex: /subjects)
  - **Resultado esperado:** Acesso negado ou redirecionado

### 4.4 Notificações e Feedbacks

- [ ] **Teste 4.4.1:** Mensagens de sucesso aparecem
  - Ao criar/editar/excluir qualquer item
  - **Resultado esperado:** Toast/mensagem de sucesso aparece

- [ ] **Teste 4.4.2:** Mensagens de erro aparecem
  - Ao tentar ação inválida (ex: criar disciplina sem nome)
  - **Resultado esperado:** Mensagem de erro clara aparece

---

## 📝 Registro de Problemas

Use esta seção para anotar problemas encontrados:

| # | Teste | Problema Encontrado | Gravidade |
|---|-------|---------------------|-----------|
| 1 | | | Alta/Média/Baixa |
| 2 | | | Alta/Média/Baixa |
| 3 | | | Alta/Média/Baixa |

**Gravidade:**
- **Alta:** Impede uso de funcionalidade essencial
- **Média:** Funcionalidade funciona mas com problemas
- **Baixa:** Problema visual ou de UX

---

## ✅ Critérios de Aprovação

Para prosseguir com o deploy, o sistema deve atender:

- ✅ **Mínimo 90% dos testes passando** (34 de 38)
- ✅ **Zero problemas de gravidade ALTA**
- ✅ **Máximo 2 problemas de gravidade MÉDIA**
- ✅ **Funcionalidades essenciais 100% funcionais:**
  - Login de professor e aluno
  - Criar disciplinas e turmas
  - Agendar aulas
  - Upload de materiais
  - Criar e atribuir exercícios

---

## 🎯 Resultado Final

**Data do teste:** ___/___/2026  
**Testado por:** _________________  
**Testes passando:** ___ / 38 (___%  )  
**Problemas encontrados:** ___  
**Aprovado para deploy?** ☐ Sim  ☐ Não

**Observações:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 📞 Próximos Passos

### Se APROVADO (≥90% passando):
1. ✅ Prosseguir com deploy no VPS seguindo o `GUIA_DEPLOY_COMPLETO.md`
2. ✅ Configurar TiDB Cloud seguindo o `GUIA_TIDB_CLOUD.md`
3. ✅ Aplicar índices do banco (`scripts/add-indexes.sql`)
4. ✅ Configurar monitoramento seguindo `GUIA_MONITORAMENTO.md`

### Se REPROVADO (<90% passando):
1. ❌ Anotar todos os problemas encontrados
2. ❌ Reportar problemas para correção
3. ❌ Aguardar correções
4. ❌ Repetir este checklist

---

**Dica:** Salve este documento preenchido para referência futura e documentação do projeto.

---

*Checklist criado por Manus AI em 19/01/2026*
