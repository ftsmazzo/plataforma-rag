# 📋 Resumo da Migração - Remoção Manus, PostgreSQL + pgvector, MinIO

## ✅ Alterações Concluídas

### 1. Schema do Banco de Dados
- ✅ Convertido de MySQL para **PostgreSQL**
- ✅ Adicionado suporte a **pgvector** para embeddings
- ✅ Campo `embedding` agora usa tipo `vector` do pgvector
- ✅ Renomeado `s3Key/s3Url` para `storageKey/storageUrl` (MinIO)
- ✅ Removido campo `openId` dos usuários, adicionado `email` e `password`
- ✅ Atualizado `drizzle.config.ts` para PostgreSQL

### 2. Dependências do Package.json
- ✅ Removido `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`
- ✅ Removido `mysql2`
- ✅ Removido `vite-plugin-manus-runtime`
- ✅ Adicionado `pg` (PostgreSQL client)
- ✅ Adicionado `@types/pg`
- ✅ Adicionado `drizzle-pgvector` (suporte a vetores)
- ✅ Adicionado `minio` (cliente MinIO)
- ✅ Adicionado `bcryptjs` e `@types/bcryptjs` (hash de senhas)

### 3. Sistema de Autenticação
- ✅ Criado `server/_core/auth.ts` com autenticação JWT simples
- ✅ Removido `server/_core/oauth.ts` (OAuth Manus)
- ✅ Removido `server/_core/sdk.ts` (SDK Manus)
- ✅ Atualizado `server/_core/context.ts` para usar nova autenticação
- ✅ Removido registro de rotas OAuth do `server/_core/index.ts`

### 4. Storage
- ✅ Criado novo `server/storage.ts` para MinIO
- ✅ Substituído S3 por MinIO com presigned URLs
- ✅ Atualizado `server/_core/env.ts` com variáveis MinIO

### 5. Database (Parcial)
- ✅ Atualizado `server/db.ts` para usar PostgreSQL (`drizzle-orm/node-postgres`)
- ✅ Substituído `getUserByOpenId` por `getUserByEmail` e `getUserById`
- ✅ Atualizado referências `s3Key/s3Url` para `storageKey/storageUrl` (parcial)
- ⚠️ Ainda precisa atualizar queries SQL específicas do MySQL

## ⚠️ Pendências Importantes

### 1. Rotas de Autenticação (CRÍTICO)
- ❌ Criar rotas de login/registro em `server/routers.ts`
- ❌ Atualizar rotas existentes que usam `openId`
- ❌ Criar endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

### 2. Atualizações no Código do Servidor
- ❌ Atualizar `server/routers.ts` para usar nova autenticação
- ❌ Atualizar todas as referências de `s3Key/s3Url` para `storageKey/storageUrl`
- ❌ Atualizar queries SQL MySQL para PostgreSQL
- ❌ Atualizar `server/api-routes.ts` para PostgreSQL
- ❌ Atualizar outros arquivos que usam MySQL

### 3. Frontend
- ❌ Remover componente `ManusDialog`
- ❌ Criar páginas de login/registro
- ❌ Atualizar `client/src/const.ts` (remover OAuth)
- ❌ Atualizar `client/src/_core/hooks/useAuth.ts`
- ❌ Remover referências ao Manus no frontend

### 4. Template EasyPanel
- ❌ Atualizar para PostgreSQL em vez de MySQL
- ❌ Adicionar serviço MinIO
- ❌ Atualizar variáveis de ambiente
- ❌ Remover variáveis OAuth Manus

### 5. Dockerfile e Scripts
- ❌ Atualizar `Dockerfile` (remover mysql-client, adicionar postgres-client)
- ❌ Atualizar `scripts/init-db.sh` para PostgreSQL
- ❌ Atualizar `docker-compose.yml` para PostgreSQL e MinIO

### 6. Documentação
- ❌ Atualizar `README.md`
- ❌ Atualizar `ENVIRONMENT_VARIABLES.md`
- ❌ Criar guia de setup MinIO
- ❌ Atualizar guias de deploy

## 🔧 Próximos Passos Recomendados

1. **Criar rotas de autenticação** (login/register/logout)
2. **Atualizar template EasyPanel** com PostgreSQL e MinIO
3. **Atualizar Dockerfile e scripts**
4. **Atualizar frontend** para nova autenticação
5. **Testar migração completa**

## 📝 Notas Importantes

- O schema foi convertido, mas algumas queries ainda precisam ser ajustadas
- A autenticação JWT está pronta, mas falta criar as rotas de login/registro
- MinIO precisa ser configurado no EasyPanel
- Frontend ainda precisa ser atualizado para remover Manus
