# Padrões de Design - Sistema de Gestão Educacional

## 📋 Visão Geral

Este documento define os padrões visuais e de layout que devem ser seguidos em todas as páginas do sistema para garantir consistência e profissionalismo.

---

## 🎨 Paleta de Cores

### Cores Primárias (Bordas de Cards)
- **Azul**: `border-blue-500` - Usado para métricas principais, pontos, totais
- **Verde**: `border-green-500` - Usado para rankings, posições, conquistas
- **Laranja**: `border-orange-500` - Usado para sequências, streaks, alertas
- **Roxo**: `border-purple-500` - Usado para badges, conquistas especiais
- **Vermelho**: `border-red-500` - Usado para pendências, alertas críticos
- **Amarelo**: `border-yellow-500` - Usado para avisos, lembretes

### Cores de Fundo para Ícones
- **Azul**: `bg-blue-100` com ícone `text-blue-600`
- **Verde**: `bg-green-100` com ícone `text-green-600`
- **Laranja**: `bg-orange-100` com ícone `text-orange-600`
- **Roxo**: `bg-purple-100` com ícone `text-purple-600`
- **Vermelho**: `bg-red-100` com ícone `text-red-600`
- **Amarelo**: `bg-yellow-100` com ícone `text-yellow-600`

---

## 📦 Cards de Estatísticas (Padrão Estabelecido)

### Estrutura HTML
```tsx
<Card className="border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-full">
        <IconComponent className="h-5 w-5 text-blue-600" />
      </div>
      Título do Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-gray-900">{valor}</div>
    <p className="text-xs text-gray-500 mt-1">Descrição adicional</p>
  </CardContent>
</Card>
```

### Características Obrigatórias
- ✅ Borda lateral esquerda colorida de 4px (`border-l-4`)
- ✅ Sombra média com hover (`shadow-md hover:shadow-lg`)
- ✅ Transição suave (`transition-all`)
- ✅ Ícone circular com fundo colorido (`p-2 bg-{color}-100 rounded-full`)
- ✅ Ícone de tamanho 5 (`h-5 w-5`)
- ✅ Título em cinza médio (`text-gray-600`)
- ✅ Valor principal grande e em negrito (`text-3xl font-bold text-gray-900`)
- ✅ Descrição pequena em cinza claro (`text-xs text-gray-500`)

### Grid Responsivo
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards aqui */}
</div>
```

---

## 📊 Seções de Distribuição/Progresso

### Barras Horizontais com Ícones Circulares
```tsx
<div className="space-y-3">
  {items.map((item) => (
    <div key={item.id} className="flex items-center gap-3">
      {/* Ícone Circular */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: item.color }}
      >
        {item.emoji}
      </div>

      {/* Nome e Barra */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {item.name}
          </span>
          <span className="text-xs text-gray-500">{item.value}</span>
        </div>
        {/* Barra de Progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all"
            style={{ 
              width: `${item.percentage}%`,
              backgroundColor: item.color
            }}
          />
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## 📐 Espaçamentos Padrão

### Entre Seções
- `space-y-8` - Espaçamento vertical entre seções principais

### Entre Cards
- `gap-6` - Espaçamento entre cards no grid

### Dentro de Cards
- `space-y-4` ou `space-y-6` - Espaçamento interno entre elementos

### Padding de Containers
- `p-4` - Padding padrão para elementos pequenos
- `p-6` - Padding padrão para seções médias
- `p-8` - Padding padrão para seções grandes

---

## 🔤 Tipografia

### Títulos de Página
```tsx
<h1 className="text-4xl font-bold text-gray-900">Título Principal</h1>
<p className="text-gray-600 mt-2">Descrição da página</p>
```

### Títulos de Cards
```tsx
<CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
  {/* Conteúdo */}
</CardTitle>
```

### Valores Numéricos
```tsx
<div className="text-3xl font-bold text-gray-900">{valor}</div>
```

### Descrições/Legendas
```tsx
<p className="text-xs text-gray-500 mt-1">Descrição</p>
```

---

## 🎯 Ícones

### Tamanhos Padrão
- **Ícones em cards**: `h-5 w-5`
- **Ícones circulares grandes**: `w-10 h-10` (container) com emoji/ícone dentro
- **Ícones de ação**: `h-4 w-4`

### Cores
- Sempre usar cores semânticas que combinem com o contexto
- Ícones em fundos coloridos devem ter cor mais escura da mesma família

---

## 📱 Responsividade

### Breakpoints
- **Mobile**: `grid-cols-1` (padrão)
- **Tablet**: `md:grid-cols-2`
- **Desktop**: `lg:grid-cols-4`

### Cards de Estatísticas
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
```

---

## ✅ Checklist de Padronização

Ao revisar/criar uma página, verificar:

- [ ] Cards de estatísticas seguem o padrão (border-l-4, ícone circular, cores corretas)
- [ ] Grid responsivo implementado corretamente (1-2-4 colunas)
- [ ] Espaçamentos consistentes (gap-6, space-y-8)
- [ ] Tipografia padronizada (text-4xl para títulos, text-3xl para valores)
- [ ] Ícones com tamanhos corretos (h-5 w-5 para cards)
- [ ] Cores semânticas aplicadas corretamente
- [ ] Sombras e transições adicionadas (shadow-md hover:shadow-lg transition-all)
- [ ] Barras de progresso com ícones circulares (quando aplicável)
- [ ] Descrições em cinza claro (text-gray-500)
- [ ] Layout mobile testado

---

## 🚫 Anti-Padrões (Evitar)

### ❌ Cards com Gradientes Coloridos
```tsx
// NÃO USAR
<Card className="bg-gradient-to-br from-blue-50 to-blue-100">
```

### ❌ Ícones Pequenos Demais
```tsx
// NÃO USAR
<Icon className="h-4 w-4" /> // Muito pequeno para cards principais
```

### ❌ Bordas Completas Coloridas
```tsx
// NÃO USAR
<Card className="border-2 border-blue-200"> // Usar border-l-4 apenas
```

### ❌ Valores sem Hierarquia
```tsx
// NÃO USAR
<div className="text-xl">{valor}</div> // Usar text-3xl para destaque
```

---

## 📝 Páginas Já Padronizadas

- ✅ **GamificationDashboard.tsx** (Professor) - Referência principal
- ✅ **StudentGamification.tsx** (Aluno) - Recém padronizada

---

## 🎯 Próximas Páginas a Padronizar

### Prioridade Alta (Dashboards e Páginas Principais)
1. Dashboard.tsx (Professor)
2. StudentDashboard.tsx (Aluno)
3. Reports.tsx (Relatórios)

### Prioridade Média (Páginas de Gestão)
4. Students.tsx (Gestão de Alunos)
5. Classes.tsx (Gestão de Turmas)
6. Subjects.tsx (Gestão de Disciplinas)
7. Tasks.tsx (Gestão de Tarefas)
8. LearningPaths.tsx (Trilhas de Aprendizagem)

### Prioridade Baixa (Páginas Secundárias)
9. Profile.tsx (Perfil do Professor)
10. StudentProfile.tsx (Perfil do Aluno)
11. Calendar.tsx (Calendário)
12. Schedule.tsx (Grade de Horários)

---

## 🔄 Processo de Padronização

1. **Analisar** a página atual e identificar elementos fora do padrão
2. **Mapear** os cards e seções que precisam ser ajustados
3. **Aplicar** os padrões documentados neste guia
4. **Testar** responsividade em diferentes tamanhos de tela
5. **Validar** visualmente comparando com páginas de referência
6. **Marcar** como concluído no todo.md

---

**Última atualização**: 26/12/2025
**Responsável**: Sistema de Gestão Educacional
