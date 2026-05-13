# 🔐 Variáveis de Ambiente - Guia Completo para EasyPanel

## 📋 Variáveis Obrigatórias

Estas variáveis **DEVEM** ser configuradas na aplicação no EasyPanel:

### 1. Banco de Dados (PostgreSQL)
```env
DATABASE_URL=postgresql://postgres:SENHA_DO_POSTGRES@nome-do-servico-postgres:5432/nome-do-banco
```

**Como obter:**
- No EasyPanel, vá no serviço PostgreSQL
- Copie a string de conexão ou monte manualmente:
  - `postgresql://` + `postgres` + `:` + `SENHA` + `@` + `NOME_SERVICO` + `:5432/` + `NOME_BANCO`
- Exemplo: `postgresql://postgres:abc123@rag-postgres:5432/rag_knowledge_base`

### 2. OpenAI API
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Como obter:**
- Acesse: https://platform.openai.com/api-keys
- Crie uma nova chave API
- Copie e cole aqui

### 3. JWT Secret
```env
JWT_SECRET=chave-aleatoria-muito-longa-e-segura-aqui
```

**Como gerar:**
```bash
openssl rand -base64 32
```
Ou use qualquer string aleatória longa (mínimo 32 caracteres)

### 4. MinIO - Access Key
```env
MINIO_ACCESS_KEY=minioadmin
```

**Valor:** Use o mesmo `MINIO_ROOT_USER` do serviço MinIO

### 5. MinIO - Secret Key
```env
MINIO_SECRET_KEY=minioadmin123
```

**Valor:** Use o mesmo `MINIO_ROOT_PASSWORD` do serviço MinIO

## 🔧 Variáveis Opcionais (com valores padrão)

Estas variáveis têm valores padrão, mas você pode customizar:

### MinIO Configuration
```env
MINIO_ENDPOINT=nome-do-servico-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=rag-documents
```

**Nota:** 
- `MINIO_ENDPOINT` deve ser o nome do serviço MinIO no EasyPanel
- Se estiver no mesmo projeto, use: `$(PROJECT_NAME)_minio` ou `rag-minio`

### App Configuration
```env
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
VITE_APP_LOGO=
NODE_ENV=production
PORT=3000
```

## 📝 Exemplo Completo para EasyPanel

Cole estas variáveis na aba **"Environment Variables"** da aplicação:

```env
# ==================== BANCO DE DADOS ====================
DATABASE_URL=postgresql://postgres:SENHA_AQUI@rag-postgres:5432/rag_knowledge_base

# ==================== OPENAI ====================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==================== JWT ====================
JWT_SECRET=chave-aleatoria-muito-longa-e-segura-aqui

# ==================== MINIO ====================
MINIO_ENDPOINT=rag-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=rag-documents

# ==================== APP ====================
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
VITE_APP_LOGO=
NODE_ENV=production
PORT=3000
```

## 🔍 Como Descobrir os Valores

### DATABASE_URL
1. No EasyPanel, vá no serviço PostgreSQL
2. Veja as credenciais:
   - **Host**: Nome do serviço (ex: `rag-postgres`)
   - **User**: `postgres`
   - **Password**: Senha gerada pelo EasyPanel
   - **Database**: Nome do projeto ou `rag_knowledge_base`
3. Monte a URL: `postgresql://postgres:SENHA@HOST:5432/DATABASE`

### MINIO_ENDPOINT
1. No EasyPanel, veja o nome do serviço MinIO
2. Use esse nome (ex: `rag-minio` ou `$(PROJECT_NAME)_minio`)

### MINIO_ACCESS_KEY e MINIO_SECRET_KEY
1. No EasyPanel, vá no serviço MinIO
2. Veja as variáveis `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`
3. Use os mesmos valores

## ✅ Checklist

Antes de fazer deploy, confirme:

- [ ] `DATABASE_URL` configurada corretamente
- [ ] `OPENAI_API_KEY` válida
- [ ] `JWT_SECRET` gerada (não use a padrão em produção!)
- [ ] `MINIO_ACCESS_KEY` igual ao `MINIO_ROOT_USER`
- [ ] `MINIO_SECRET_KEY` igual ao `MINIO_ROOT_PASSWORD`
- [ ] `MINIO_ENDPOINT` aponta para o serviço MinIO correto
- [ ] `MINIO_BUCKET_NAME` existe no MinIO (ou será criado automaticamente)

## 🚨 Importante

1. **Nunca commite** essas variáveis no Git
2. **Use senhas fortes** em produção
3. **Gere JWT_SECRET** aleatória e única
4. **Teste a conexão** antes de fazer deploy

---

**Pronto!** Com essas variáveis configuradas, sua aplicação estará pronta para rodar! 🚀
