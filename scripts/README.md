# Scripts de Manutenção

Este diretório contém scripts utilitários para manutenção do sistema.

## clean-test-users.ts

Script para limpar usuários de teste do banco de dados.

**Quando usar:**
- Após executar testes automatizados que deixaram usuários de teste no banco
- Quando a página de Gerenciamento de Usuários mostrar muitos usuários com email @test.com
- Para manutenção periódica do banco de dados

**Como executar:**
```bash
cd /home/ubuntu/teacher_schedule_system
pnpm tsx scripts/clean-test-users.ts
```

**O que faz:**
- Lista todos os usuários com email contendo `@test.com`
- Remove permanentemente esses usuários do banco de dados
- Protege usuários reais (não remove emails que contenham seu domínio real)
- Exibe relatório detalhado de usuários removidos

**Segurança:**
- Apenas remove usuários com `@test.com` no email
- Não afeta usuários reais do sistema
- Pode ser executado quantas vezes necessário sem riscos
