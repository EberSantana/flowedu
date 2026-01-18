# Especificação: Guia de Animação por Módulo em Trilhas de Aprendizagem

## Objetivo
Criar um sistema para que professores possam adicionar um "guia de animação" ou "roteiro de aprendizagem" por módulo nas trilhas de aprendizagem, facilitando o aprendizado dos alunos com instruções passo a passo.

## Estrutura de Dados

### Campos adicionados na tabela `learning_modules`:
- `guideTitle` (VARCHAR 255): Título do guia de animação
- `guideContent` (TEXT): Conteúdo do guia em HTML/Markdown
- `guideType` (ENUM): Tipo de guia ('text', 'video', 'interactive', 'mixed')

**Status**: ✅ Campos já adicionados ao banco de dados via SQL

## Backend - Rotas tRPC

### 1. Salvar/Atualizar Guia de Animação
```typescript
learningPath.updateModuleGuide: protectedProcedure
  Input: {
    moduleId: number
    guideTitle: string (min 1 char)
    guideContent: string (min 1 char)
    guideType: 'text' | 'video' | 'interactive' | 'mixed'
  }
  Output: { success: boolean, module: LearningModule }
```

### 2. Buscar Guia de Animação
```typescript
learningPath.getModuleGuide: protectedProcedure
  Input: { moduleId: number }
  Output: {
    guideTitle: string | null
    guideContent: string | null
    guideType: string
  }
```

### 3. Deletar Guia de Animação
```typescript
learningPath.deleteModuleGuide: protectedProcedure
  Input: { moduleId: number }
  Output: { success: boolean }
```

## Frontend - Interface do Professor

### Página: Edição de Módulo (Trilha de Aprendizagem)
Local: Componente que edita módulos (provavelmente em um modal ou página dedicada)

**Adicionar seção "Guia de Animação":**
- Campo de texto para "Título do Guia"
- Editor de texto rico (Rich Text Editor) para "Conteúdo do Guia"
  - Suportar: negrito, itálico, listas, links, imagens
  - Usar biblioteca como: `react-quill`, `tiptap`, ou `slate`
- Dropdown para "Tipo de Guia":
  - Texto
  - Vídeo
  - Interativo
  - Misto
- Botão "Salvar Guia"
- Botão "Deletar Guia" (se já existe)
- Preview do guia

### Componente Recomendado
```tsx
<ModuleGuideEditor 
  moduleId={moduleId}
  onSave={(guide) => updateModuleGuide(guide)}
  onDelete={() => deleteModuleGuide(moduleId)}
/>
```

## Frontend - Visualização do Aluno

### Página: Trilha de Aprendizagem do Aluno
Local: Portal do aluno, ao visualizar módulos

**Adicionar para cada módulo:**
- Indicador visual: "📖 Guia disponível" (se guideTitle existe)
- Botão "Ver Guia de Animação"
- Modal/Drawer que exibe:
  - Título do guia
  - Conteúdo formatado (HTML renderizado)
  - Tipo de guia com ícone
  - Botão "Fechar"

### Componente Recomendado
```tsx
<ModuleGuideViewer 
  moduleId={moduleId}
  onClose={() => setShowGuide(false)}
/>
```

## Fluxo de Uso

### Professor:
1. Acessa página de edição de módulo
2. Preenche "Título do Guia" (ex: "Passo a Passo: Introdução ao Módulo")
3. Escreve conteúdo no editor de texto rico
4. Seleciona tipo de guia
5. Clica "Salvar Guia"
6. Guia fica disponível para alunos

### Aluno:
1. Acessa trilha de aprendizagem
2. Vê indicador "📖 Guia disponível" no módulo
3. Clica em "Ver Guia de Animação"
4. Modal abre mostrando o guia formatado
5. Lê as instruções e segue o roteiro de aprendizagem

## Próximos Passos

1. **Atualizar Schema Drizzle**: Adicionar tipos TypeScript para os novos campos
2. **Implementar Rotas tRPC**: Adicionar as 3 rotas de guia ao backend
3. **Criar Editor**: Componente React com editor de texto rico
4. **Criar Visualizador**: Componente para aluno visualizar o guia
5. **Integrar em Páginas**: Adicionar em edição de módulo e visualização de trilha
6. **Testar**: Fluxo completo professor → aluno

## Considerações de Design

- **Responsividade**: Guia deve ser legível em mobile
- **Acessibilidade**: Usar semântica HTML correta
- **Performance**: Lazy load do conteúdo do guia
- **Segurança**: Sanitizar HTML do guideContent
- **Consistência**: Seguir design do portal do aluno

## Banco de Dados

Campos já adicionados:
```sql
ALTER TABLE learning_modules 
ADD COLUMN guideTitle VARCHAR(255) NULL,
ADD COLUMN guideContent TEXT NULL,
ADD COLUMN guideType ENUM('text', 'video', 'interactive', 'mixed') DEFAULT 'text';
```

Status: ✅ Concluído
