# ⚡ Configuração Rápida - EasyPanel

## 🎯 Passo 1: Variáveis de Ambiente

Na aplicação no EasyPanel, adicione estas variáveis:

```env
DATABASE_URL=postgresql://postgres:SENHA@NOME_SERVICO_POSTGRES:5432/NOME_BANCO
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=chave-aleatoria-muito-longa-e-segura
MINIO_ENDPOINT=NOME_SERVICO_MINIO
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=senha-do-minio
MINIO_BUCKET_NAME=rag-documents
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
NODE_ENV=production
```

## 🗄️ Passo 2: Schema PostgreSQL

### Opção A: Automático (Recomendado)

As migrações serão executadas automaticamente quando a aplicação iniciar.

### Opção B: Manual

Execute o arquivo `schema-postgresql.sql` no console SQL do PostgreSQL.

## ✅ Pronto!

Depois disso, faça deploy e acesse a aplicação!

---

**Arquivos de referência:**
- `VARIAVEIS_AMBIENTE_COMPLETAS.md` - Lista detalhada
- `schema-postgresql.sql` - Schema completo
- `GUIA_DEPLOY_EASYPANEL.md` - Guia passo a passo
