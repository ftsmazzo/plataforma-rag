# 🚀 Deploy no EasyPanel - RAG Knowledge Base

Este guia explica como fazer deploy do sistema RAG Knowledge Base no EasyPanel usando Docker.

## 📋 Pré-requisitos

1. **Servidor VPS** com EasyPanel instalado
2. **Chave OpenAI API** - Obtenha em [platform.openai.com](https://platform.openai.com/api-keys)
3. **Conta Manus** (opcional) - Para autenticação OAuth

## 🐳 Opção 1: Deploy com Docker Compose

### Passo 1: Clonar o Repositório

```bash
git clone <seu-repositorio>
cd rag_knowledge_base
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
POSTGRES_USER=raguser
POSTGRES_PASSWORD=sua-senha-segura-aqui
POSTGRES_DB=rag_knowledge_base
POSTGRES_PORT=5432

# OpenAI
OPENAI_API_KEY=sk-...

# JWT & Auth
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# App
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
OWNER_NAME=Admin
APP_PORT=3000
```

### Passo 3: Build e Iniciar

```bash
# Build da imagem Docker
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f app
```

### Passo 4: Acessar Aplicação

Abra `http://seu-servidor-ip:3000` no navegador.

## 🎯 Opção 2: Deploy via EasyPanel UI

### Passo 1: Criar Projeto no EasyPanel

1. Acesse seu painel EasyPanel
2. Clique em **"New Project"**
3. Nomeie o projeto como `rag-knowledge-base`

### Passo 2: Adicionar Banco de Dados PostgreSQL

1. No projeto, clique em **"Add Service"**
2. Escolha **"PostgreSQL"**
3. Configure:
   - **Service Name**: `rag-postgres`
   - **Version**: `16` (com pgvector)
   - **Database Name**: `rag_knowledge_base`
   - **Username**: `raguser`
   - **Password**: Gere uma senha segura
4. Clique em **"Create"**

### Passo 3: Habilitar Extensão pgvector

1. Acesse o terminal do container PostgreSQL
2. Execute:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Passo 4: Adicionar Aplicação

1. Clique em **"Add Service"** novamente
2. Escolha **"Docker Image"**
3. Configure:
   - **Service Name**: `rag-app`
   - **Image**: `seu-usuario/rag-knowledge-base:latest`
   - **Port**: `3000`

### Passo 5: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no serviço da aplicação:

```env
DATABASE_URL=postgresql://raguser:SUA_SENHA@rag-postgres:5432/rag_knowledge_base
OPENAI_API_KEY=sk-...
JWT_SECRET=sua-chave-jwt-super-secreta
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
OWNER_NAME=Admin
NODE_ENV=production
```

### Passo 6: Configurar Domínio

1. Na aba **"Domains"** do serviço
2. Adicione seu domínio customizado ou use o subdomínio do EasyPanel
3. Habilite SSL automático

### Passo 7: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e inicialização
3. Acesse via domínio configurado

## 🔧 Opção 3: Build Manual da Imagem Docker

### Passo 1: Build Local

```bash
# Build da imagem
docker build -t rag-knowledge-base:latest .

# Testar localmente
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e OPENAI_API_KEY="sk-..." \
  rag-knowledge-base:latest
```

### Passo 2: Push para Registry

```bash
# Tag para seu registry
docker tag rag-knowledge-base:latest seu-usuario/rag-knowledge-base:latest

# Push
docker push seu-usuario/rag-knowledge-base:latest
```

### Passo 3: Deploy no EasyPanel

Use a imagem `seu-usuario/rag-knowledge-base:latest` no EasyPanel conforme Opção 2.

## 📦 Opção 4: Template EasyPanel (Recomendado)

### Estrutura do Template

O projeto inclui arquivos de template na pasta `easypanel/`:

```
easypanel/
├── meta.yaml    # Metadados e configuração
├── index.ts     # Gerador de serviços
└── assets/      # Logo e screenshots
```

### Deploy com Template

1. Acesse o repositório de templates do EasyPanel
2. Faça fork e adicione a pasta `easypanel/` do projeto
3. No EasyPanel, vá em **"Templates"**
4. Procure por **"RAG Knowledge Base"**
5. Clique em **"Install"**
6. Preencha apenas:
   - **OpenAI API Key**
   - **Project Name**
7. Clique em **"Deploy"**

Tudo será configurado automaticamente!

## 🔐 Variáveis de Ambiente Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | Chave API OpenAI | `sk-proj-...` |
| `JWT_SECRET` | Segredo para assinatura JWT | String aleatória segura |

## 🔧 Variáveis de Ambiente Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `OAUTH_SERVER_URL` | URL do servidor OAuth Manus | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | URL do portal OAuth | `https://portal.manus.im` |
| `VITE_APP_TITLE` | Título da aplicação | `RAG Knowledge Base` |
| `OWNER_NAME` | Nome do proprietário | `Admin` |
| `NODE_ENV` | Ambiente Node.js | `production` |

## 🏥 Health Check

A aplicação expõe um endpoint de health check em `/api/health`:

```bash
curl http://seu-dominio/api/health
# Resposta: {"status":"ok"}
```

## 📊 Monitoramento

### Logs da Aplicação

```bash
# Docker Compose
docker-compose logs -f app

# EasyPanel
# Acesse a aba "Logs" no serviço
```

### Logs do Banco de Dados

```bash
# Docker Compose
docker-compose logs -f postgres

# EasyPanel
# Acesse a aba "Logs" no serviço PostgreSQL
```

## 🔄 Atualizações

### Docker Compose

```bash
# Pull nova versão
git pull

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d
```

### EasyPanel

1. Faça push da nova imagem para o registry
2. No EasyPanel, clique em **"Redeploy"** no serviço

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

- Verifique se o PostgreSQL está rodando
- Confirme a `DATABASE_URL` está correta
- Teste conexão: `psql $DATABASE_URL`

### Erro: "OpenAI API key invalid"

- Verifique se a chave está correta
- Confirme que tem créditos na conta OpenAI
- Teste: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Erro: "pgvector extension not found"

- Conecte no PostgreSQL
- Execute: `CREATE EXTENSION IF NOT EXISTS vector;`
- Reinicie a aplicação

### Aplicação não inicia

- Verifique logs: `docker-compose logs app`
- Confirme todas variáveis de ambiente estão configuradas
- Teste health check: `curl http://localhost:3000/api/health`

## 📚 Recursos Adicionais

- [Documentação EasyPanel](https://easypanel.io/docs)
- [PostgreSQL pgvector](https://github.com/pgvector/pgvector)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique a seção de Troubleshooting acima
2. Consulte os logs da aplicação
3. Abra uma issue no repositório do projeto

---

**Desenvolvido com ❤️ usando Manus AI**
