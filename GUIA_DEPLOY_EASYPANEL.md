# 🚀 Guia Completo de Deploy no EasyPanel

## 📋 Pré-requisitos

- ✅ PostgreSQL criado no EasyPanel
- ✅ MinIO criado no EasyPanel
- ✅ Bucket `rag-documents` criado no MinIO
- ✅ Aplicação criada no EasyPanel

## 🔧 Passo 1: Configurar Variáveis de Ambiente

Na aplicação no EasyPanel, vá em **"Environment Variables"** e adicione:

### Variáveis Obrigatórias

```env
# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://postgres:SENHA_DO_POSTGRES@NOME_SERVICO_POSTGRES:5432/NOME_BANCO

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret (gere uma chave aleatória)
JWT_SECRET=chave-aleatoria-muito-longa-e-segura-aqui

# MinIO Configuration
MINIO_ENDPOINT=NOME_SERVICO_MINIO
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=senha-do-minio
MINIO_BUCKET_NAME=rag-documents
```

### Variáveis Opcionais

```env
# App Configuration
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
VITE_APP_LOGO=
NODE_ENV=production
PORT=3000
```

## 🗄️ Passo 2: Criar Schema no PostgreSQL

### Opção A: Automático (Recomendado)

As migrações serão executadas automaticamente quando a aplicação iniciar via script `init-db.sh`.

### Opção B: Manual

Se preferir criar manualmente:

1. **Acesse o terminal do PostgreSQL no EasyPanel**
2. **Execute o arquivo `schema-postgresql.sql`**:

```bash
# No terminal do PostgreSQL
psql -U postgres -d nome_do_banco -f /caminho/para/schema-postgresql.sql
```

Ou copie e cole o conteúdo de `schema-postgresql.sql` diretamente no console SQL.

## 📝 Passo 3: Verificar Configuração

### Verificar DATABASE_URL

A URL deve seguir este formato:
```
postgresql://usuario:senha@host:porta/banco
```

**Exemplo:**
```
postgresql://postgres:abc123xyz@rag-postgres:5432/rag_knowledge_base
```

### Verificar MinIO

1. Acesse o console MinIO: `http://seu-servidor:9001`
2. Login com `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`
3. Confirme que o bucket `rag-documents` existe

### Verificar Variáveis

Confirme que todas as variáveis obrigatórias estão configuradas:
- ✅ `DATABASE_URL`
- ✅ `OPENAI_API_KEY`
- ✅ `JWT_SECRET`
- ✅ `MINIO_ACCESS_KEY`
- ✅ `MINIO_SECRET_KEY`

## 🚀 Passo 4: Deploy

1. **Salve as variáveis de ambiente**
2. **Clique em "Deploy" ou "Redeploy"**
3. **Aguarde a aplicação iniciar**
4. **Verifique os logs** para confirmar:
   - ✅ Banco de dados conectado
   - ✅ Migrações executadas
   - ✅ Aplicação rodando na porta 3000

## ✅ Passo 5: Primeiro Acesso

1. **Acesse a aplicação** via domínio configurado
2. **Clique em "Criar conta"**
3. **Crie sua conta** (primeiro usuário será "user")
4. **Para tornar admin**, execute no PostgreSQL:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
   ```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se `DATABASE_URL` está correta
2. Confirme que o PostgreSQL está rodando
3. Teste a conexão manualmente

### Erro: "MinIO connection failed"

**Solução:**
1. Verifique `MINIO_ENDPOINT` (deve ser o nome do serviço)
2. Confirme `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`
3. Teste acesso ao MinIO console

### Erro: "pgvector extension not found"

**Solução:**
1. Execute manualmente: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Ou aguarde o script `init-db.sh` executar

### Migrações não executam

**Solução:**
1. Verifique os logs da aplicação
2. Execute manualmente: `pnpm db:push` (no container)
3. Ou execute o `schema-postgresql.sql` manualmente

## 📚 Arquivos de Referência

- `VARIAVEIS_AMBIENTE_COMPLETAS.md` - Lista completa de variáveis
- `schema-postgresql.sql` - Schema SQL completo
- `PRONTO_PARA_DEPLOY.md` - Guia geral

---

**Pronto!** Com isso, sua aplicação estará funcionando! 🎉
