# 🔐 Variáveis de Ambiente - RAG Knowledge Base

Este documento lista todas as variáveis de ambiente necessárias para executar o sistema RAG Knowledge Base.

## 📋 Variáveis Obrigatórias

Estas variáveis **DEVEM** ser configuradas para o sistema funcionar:

### `DATABASE_URL`
- **Descrição**: String de conexão PostgreSQL com pgvector
- **Formato**: `postgresql://user:password@host:port/database`
- **Exemplo**: `postgresql://raguser:mypassword@localhost:5432/rag_knowledge_base`
- **Onde obter**: Configure no seu servidor PostgreSQL

### `OPENAI_API_KEY`
- **Descrição**: Chave API da OpenAI para geração de embeddings
- **Formato**: `sk-proj-...` ou `sk-...`
- **Exemplo**: `sk-proj-abc123xyz...`
- **Onde obter**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### `JWT_SECRET`
- **Descrição**: Chave secreta para assinatura de tokens JWT
- **Formato**: String aleatória segura (mínimo 32 caracteres)
- **Exemplo**: `your-super-secret-jwt-key-change-in-production`
- **Como gerar**: `openssl rand -base64 32`

## 🔧 Variáveis Opcionais

Estas variáveis têm valores padrão, mas podem ser customizadas:

### Autenticação OAuth

#### `OAUTH_SERVER_URL`
- **Descrição**: URL do servidor OAuth Manus
- **Padrão**: `https://api.manus.im`
- **Customizar**: Apenas se usar servidor OAuth próprio

#### `VITE_OAUTH_PORTAL_URL`
- **Descrição**: URL do portal de login OAuth
- **Padrão**: `https://portal.manus.im`
- **Customizar**: Apenas se usar portal próprio

### Configuração da Aplicação

#### `VITE_APP_ID`
- **Descrição**: Identificador único da aplicação
- **Padrão**: `rag-knowledge-base`
- **Customizar**: Se quiser ID diferente

#### `VITE_APP_TITLE`
- **Descrição**: Título exibido na interface
- **Padrão**: `RAG Knowledge Base`
- **Customizar**: Para personalizar o nome

#### `VITE_APP_LOGO`
- **Descrição**: URL do logo da aplicação
- **Padrão**: (vazio)
- **Customizar**: URL pública da imagem do logo

### Informações do Proprietário

#### `OWNER_OPEN_ID`
- **Descrição**: OpenID do proprietário (para permissões admin)
- **Padrão**: (vazio)
- **Customizar**: OpenID do usuário administrador

#### `OWNER_NAME`
- **Descrição**: Nome do proprietário
- **Padrão**: `Admin`
- **Customizar**: Nome do administrador

### APIs Integradas Manus (Opcional)

#### `BUILT_IN_FORGE_API_URL`
- **Descrição**: URL das APIs integradas Manus
- **Padrão**: (vazio)
- **Quando usar**: Se estiver usando plataforma Manus

#### `BUILT_IN_FORGE_API_KEY`
- **Descrição**: Chave de autenticação para APIs Manus (server-side)
- **Padrão**: (vazio)
- **Quando usar**: Se estiver usando plataforma Manus

#### `VITE_FRONTEND_FORGE_API_KEY`
- **Descrição**: Chave de autenticação para APIs Manus (frontend)
- **Padrão**: (vazio)
- **Quando usar**: Se estiver usando plataforma Manus

#### `VITE_FRONTEND_FORGE_API_URL`
- **Descrição**: URL das APIs Manus para frontend
- **Padrão**: (vazio)
- **Quando usar**: Se estiver usando plataforma Manus

### Analytics (Opcional)

#### `VITE_ANALYTICS_ENDPOINT`
- **Descrição**: Endpoint para envio de eventos de analytics
- **Padrão**: (vazio)
- **Quando usar**: Se quiser tracking de uso

#### `VITE_ANALYTICS_WEBSITE_ID`
- **Descrição**: ID do website no sistema de analytics
- **Padrão**: (vazio)
- **Quando usar**: Se quiser tracking de uso

### Configuração do Servidor

#### `NODE_ENV`
- **Descrição**: Ambiente de execução do Node.js
- **Valores**: `development` | `production`
- **Padrão**: `production`
- **Customizar**: Use `development` apenas para debug

#### `APP_PORT`
- **Descrição**: Porta onde a aplicação escuta
- **Padrão**: `3000`
- **Customizar**: Se a porta 3000 estiver em uso

## 🐳 Variáveis para Docker Compose

Quando usar `docker-compose.yml`, configure também:

### `POSTGRES_USER`
- **Descrição**: Usuário do banco PostgreSQL
- **Padrão**: `raguser`
- **Exemplo**: `raguser`

### `POSTGRES_PASSWORD`
- **Descrição**: Senha do banco PostgreSQL
- **Padrão**: `changeme`
- **Exemplo**: `my-secure-password-123`
- **⚠️ IMPORTANTE**: Use senha forte em produção!

### `POSTGRES_DB`
- **Descrição**: Nome do banco de dados
- **Padrão**: `rag_knowledge_base`
- **Exemplo**: `rag_knowledge_base`

### `POSTGRES_PORT`
- **Descrição**: Porta do PostgreSQL
- **Padrão**: `5432`
- **Exemplo**: `5432`

## 📝 Exemplo de Configuração Mínima

Para rodar o sistema, você precisa apenas destas 3 variáveis:

```env
DATABASE_URL=postgresql://raguser:mypassword@localhost:5432/rag_knowledge_base
OPENAI_API_KEY=sk-proj-abc123xyz...
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## 🔒 Segurança

### ⚠️ NUNCA faça:
- ❌ Commitar arquivo `.env` no git
- ❌ Compartilhar `OPENAI_API_KEY` publicamente
- ❌ Usar senhas fracas para `POSTGRES_PASSWORD`
- ❌ Usar `JWT_SECRET` padrão em produção

### ✅ SEMPRE faça:
- ✅ Use `.gitignore` para excluir `.env`
- ✅ Gere `JWT_SECRET` aleatório e seguro
- ✅ Use senhas fortes para banco de dados
- ✅ Mantenha credenciais em gerenciador de secrets

## 🚀 Como Configurar

### Desenvolvimento Local

1. Copie as variáveis necessárias
2. Configure no arquivo `.env` local
3. Execute `docker-compose up -d`

### Produção (EasyPanel)

1. Acesse o painel do serviço
2. Vá em **"Environment Variables"**
3. Adicione cada variável necessária
4. Clique em **"Save"** e **"Redeploy"**

### Produção (Docker Manual)

1. Configure variáveis no sistema operacional
2. Ou passe via `-e` no `docker run`:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e OPENAI_API_KEY="sk-..." \
  -e JWT_SECRET="..." \
  rag-knowledge-base:latest
```

## 🆘 Troubleshooting

### Erro: "DATABASE_URL is required"
- **Solução**: Configure a variável `DATABASE_URL`

### Erro: "Invalid OpenAI API key"
- **Solução**: Verifique se `OPENAI_API_KEY` está correta
- **Teste**: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Erro: "JWT secret is required"
- **Solução**: Configure `JWT_SECRET` com string aleatória segura

---

**📚 Documentação Adicional**:
- [Deploy Guide](./DEPLOY.md)
- [README Principal](./README.md)
