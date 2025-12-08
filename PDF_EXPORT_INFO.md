# Exportação de Plano de Curso para PDF

## Funcionalidade Implementada

O sistema agora permite exportar o plano de curso de qualquer disciplina para um arquivo PDF profissional.

## Como Usar

1. Acesse **Gerenciar Disciplinas**
2. Clique no botão **"Plano de Curso cadastrado"** de qualquer disciplina
3. No modal que abrir, clique no botão **"Exportar PDF"** (ao lado do botão "Imprimir")
4. O arquivo PDF será gerado e baixado automaticamente

## Formato do PDF

O PDF gerado contém:

### Cabeçalho (Azul)
- Título: "Plano de Curso"
- Nome da disciplina
- Código da disciplina

### Seções com Cores Distintas
Cada seção possui:
- Título colorido em negrito
- Linha colorida decorativa
- Conteúdo formatado com quebras de linha automáticas

**Cores das Seções:**
- 🔵 **Ementa** - Azul (#3B82F6)
- 🟢 **Objetivo Geral** - Verde (#22C55E)
- 🟣 **Objetivos Específicos** - Roxo (#A855F7)
- 🟠 **Conteúdo Programático** - Laranja (#F97316)
- 🔴 **Bibliografia Básica** - Vermelho (#EF4444)
- 🌸 **Bibliografia Complementar** - Rosa (#EC4899)

## Características Técnicas

- **Biblioteca**: jsPDF 3.0.4
- **Formato**: A4 (210mm x 297mm)
- **Margens**: 20mm em todos os lados
- **Quebras de página**: Automáticas quando o conteúdo excede a página
- **Nome do arquivo**: `Plano_de_Curso_[CÓDIGO].pdf`
- **Tamanho médio**: ~14KB (varia conforme conteúdo)

## Exemplo de Arquivo Gerado

```
Plano_de_Curso_IMSI31_-_D2.pdf
```

Este arquivo contém 3 páginas com todo o conteúdo do plano de curso formatado profissionalmente.

## Benefícios

✅ Compartilhamento fácil por e-mail ou plataformas digitais
✅ Arquivo leve e compatível com todos os leitores de PDF
✅ Formatação profissional com cores e hierarquia visual
✅ Impressão opcional com qualidade garantida
✅ Backup digital do plano de curso
