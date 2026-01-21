# 📦 Guia de Exportação de Dados - Sistema de Gestão de Tempo para Professores

## Visão Geral

Este documento explica como exportar todos os dados do sistema para backup seguro. Existem três métodos disponíveis, cada um adequado para diferentes necessidades.

---

## Método 1: Exportação via Interface de Gerenciamento (Recomendado)

### Passo a Passo

1. **Acesse a Interface de Gerenciamento**
   - Clique no ícone de gerenciamento no canto superior direito da tela
   - Navegue até a aba **"Database"**

2. **Visualize e Exporte Dados**
   - A interface mostra todas as tabelas do banco de dados
   - Você pode visualizar, adicionar, editar e excluir registros diretamente
   - Use as ferramentas de exportação integradas para gerar backups

3. **Acesse Configurações de Conexão**
   - No canto inferior esquerdo da aba Database, clique em **"Settings"** (ícone de engrenagem)
   - Você verá as informações completas de conexão:
     - Host
     - Port
     - User
     - Password
     - Database Name
   - **Importante:** Habilite SSL para conexões seguras

### Vantagens
- ✅ Interface visual amigável
- ✅ Não requer conhecimento técnico
- ✅ Exportação direta de tabelas individuais
- ✅ Visualização de dados antes de exportar

---

## Método 2: Exportação via Linha de Comando (mysqldump)

### Pré-requisitos
- Cliente MySQL instalado
- Credenciais de acesso ao banco de dados

### Comandos

#### Exportar Banco de Dados Completo

```bash
# Formato básico
mysqldump -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] --ssl-mode=REQUIRED [DATABASE] > backup_completo.sql

# Exemplo prático (substitua com suas credenciais):
mysqldump -h gateway01.us-west-2.prod.aws.tidbcloud.com \
  -P 4000 \
  -u seu_usuario \
  -p'sua_senha' \
  --ssl-mode=REQUIRED \
  nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Exportar Tabelas Específicas

```bash
# Exportar apenas disciplinas e planos de curso
mysqldump -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] \
  --ssl-mode=REQUIRED [DATABASE] \
  subjects classes shifts time_slots scheduled_classes calendar_events \
  > backup_tabelas_principais.sql
```

#### Exportar em Formato CSV

```bash
# Conectar ao banco
mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] --ssl-mode=REQUIRED [DATABASE]

# Dentro do MySQL, exportar tabela específica
SELECT * FROM subjects 
INTO OUTFILE '/tmp/subjects.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Vantagens
- ✅ Backup completo do banco de dados
- ✅ Fácil restauração em caso de desastre
- ✅ Formato SQL padrão
- ✅ Pode ser agendado automaticamente

---

## Método 3: Exportação via Script Automatizado (Em Desenvolvimento)

### Status Atual

Um script Node.js (`export-data.mjs`) foi criado para automatizar a exportação de todas as tabelas em formato CSV. No entanto, devido a limitações técnicas com imports TypeScript, este método está sendo refinado.

### Uso Futuro (Quando Disponível)

```bash
# Executar exportação automática
cd /home/ubuntu/flowedu
node export-data.mjs
```

### O que será exportado
- ✅ Disciplinas (com planos de curso e links Google)
- ✅ Turmas
- ✅ Turnos
- ✅ Horários
- ✅ Aulas agendadas
- ✅ Eventos do calendário

---

## Estrutura de Dados Exportados

### Tabela: subjects (Disciplinas)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| name | Nome da disciplina |
| code | Código da disciplina |
| description | Descrição |
| color | Cor para identificação visual |
| ementa | Ementa do plano de curso |
| generalObjective | Objetivo geral |
| specificObjectives | Objetivos específicos |
| programContent | Conteúdo programático |
| basicBibliography | Bibliografia básica |
| complementaryBibliography | Bibliografia complementar |
| googleDriveUrl | Link do Google Drive |
| googleClassroomUrl | Link do Google Classroom |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

### Tabela: classes (Turmas)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| name | Nome da turma |
| code | Código da turma |
| description | Descrição |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

### Tabela: shifts (Turnos)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| name | Nome do turno (Matutino, Vespertino, Noturno) |
| color | Cor do turno |
| order | Ordem de exibição |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

### Tabela: time_slots (Horários)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| shiftId | ID do turno |
| period | Número do período (1, 2, 3, etc.) |
| startTime | Horário de início |
| endTime | Horário de término |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

### Tabela: scheduled_classes (Aulas Agendadas)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| subjectId | ID da disciplina |
| classId | ID da turma |
| timeSlotId | ID do horário |
| dayOfWeek | Dia da semana (1=Segunda, 6=Sábado) |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

### Tabela: calendar_events (Eventos do Calendário)

| Campo | Descrição |
|-------|-----------|
| id | Identificador único |
| title | Título do evento |
| date | Data do evento |
| type | Tipo (holiday, commemorative, school_event, personal) |
| description | Descrição detalhada |
| isRecurring | Se repete anualmente |
| userId | ID do usuário proprietário |
| createdAt | Data de criação |
| updatedAt | Data de atualização |

---

## Boas Práticas de Backup

### Frequência Recomendada

- **Backup Completo:** Semanal (todo domingo à noite)
- **Backup Incremental:** Diário (após alterações significativas)
- **Backup Antes de Mudanças Críticas:** Sempre antes de:
  - Atualizar o sistema
  - Fazer alterações em massa
  - Migrar para nova versão
  - Modificar estrutura do banco

### Armazenamento

1. **Local:** Mantenha cópias no computador local
2. **Nuvem:** Upload para Google Drive, Dropbox ou OneDrive
3. **Externo:** Disco rígido externo para segurança adicional
4. **Regra 3-2-1:** 3 cópias, 2 mídias diferentes, 1 offsite

### Teste de Restauração

- Teste a restauração de backups pelo menos uma vez por semestre
- Verifique integridade dos arquivos exportados
- Documente o processo de restauração

---

## Restauração de Dados

### A partir de Dump SQL

```bash
# Restaurar backup completo
mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] \
  --ssl-mode=REQUIRED [DATABASE] < backup_completo.sql
```

### A partir de CSV

1. Acesse a Interface de Gerenciamento → Database
2. Selecione a tabela de destino
3. Use a opção "Import" para carregar o arquivo CSV
4. Mapeie as colunas corretamente
5. Execute a importação

---

## Solução de Problemas

### Erro: "Access Denied"
- Verifique se as credenciais estão corretas
- Confirme que SSL está habilitado
- Verifique permissões do usuário no banco

### Erro: "Connection Timeout"
- Verifique conexão com a internet
- Confirme que o firewall não está bloqueando a porta 4000
- Tente novamente após alguns minutos

### Arquivo de Backup Muito Grande
- Use compressão: `gzip backup.sql`
- Exporte tabelas individualmente
- Considere backup incremental ao invés de completo

---

## Suporte

Para dúvidas ou problemas com exportação de dados:

1. Consulte a documentação oficial do MySQL/TiDB
2. Verifique logs de erro no sistema
3. Entre em contato com suporte técnico se necessário

---

*Sistema de Gestão de Tempo para Professores*  
*Documento: Guia de Exportação de Dados - Versão 1.0*  
*Última atualização: Dezembro 2025*
