# Relatório de Auditoria SQL — FlowEdu

**Gerado em:** 16/04/2026, 03:34:09  
**Schema capturado em:** 2026-04-16T06:00:00.000Z  
**Referências verificadas:** 895  
**Referências OK:** 895  
**Problemas encontrados:** 0  

## ✅ Nenhum problema encontrado

Todas as queries SQL raw estão compatíveis com o schema do TiDB.
---

## Como usar este script

```bash
# Atualizar cache do schema e auditar
node scripts/validate-sql-schema.mjs --fetch-schema --report

# Apenas auditar (usa cache)
node scripts/validate-sql-schema.mjs --report

# Modo estrito para CI/CD (falha se encontrar problemas)
node scripts/validate-sql-schema.mjs --strict
```
