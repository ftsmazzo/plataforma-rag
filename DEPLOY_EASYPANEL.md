# 🚀 Guia de Deploy no EasyPanel - RAG Knowledge Base

Este guia fornece instruções passo a passo para fazer deploy do sistema RAG Knowledge Base no EasyPanel.

## 📋 Pré-requisitos

- **VPS com EasyPanel** instalado e funcionando
- **Chave OpenAI API** - Obtenha em [platform.openai.com](https://platform.openai.com/api-keys)
- **Acesso SSH** ao servidor (opcional, para build manual)

## 🎯 Opção 1: Deploy via Template EasyPanel (Recomendado)

### Passo 1: Preparar a Imagem Docker

Antes de usar o template, você precisa ter a imagem Docker disponível. Você pode:

**Opção A: Build e Push para Docker Hub**

```bash
# No seu computador local
docker build -t seu-usuario/rag-knowledge-base:latest .
docker push seu-usuario/rag-knowledge-base:latest
```

**Opção B: Build no EasyPanel**

1. No EasyPanel, crie um serviço de build
2. Configure o build context apontando para este repositório
3. Use o Dockerfile fornecido
4. Após o build, use a imagem gerada no template

### Passo 2: Usar o Template

1. **Acesse o EasyPanel** no seu servidor
2. Clique em **"New Project"** ou **"Create Project"**
3. Nomeie o projeto (ex: `rag-knowledge-base`)
4. Clique em **"Add Service"** → **"Template"**
5. Se o template estiver disponível, selecione **"RAG Knowledge Base"**
6. Se não estiver, você pode adicionar manualmente:

   - Vá em **"Templates"** → **"Add Custom Template"**
   - Cole o conteúdo de `easypanel/meta.yaml`
   - Salve o template

### Passo 3: Configurar o Deploy

Ao usar o template, você precisará fornecer:

- **Project Name**: Nome do projeto (ex: `rag-knowledge-base`)
- **App Service Name**: Nome do serviço da aplicação (padrão: `rag-knowledge-base`)
- **App Docker Image**: Imagem Docker (ex: `seu-usuario/rag-knowledge-base:latest`)
- **Database Service Name**: Nome do serviço do banco (padrão: `rag-postgres`)
- **OpenAI API Key**: Sua chave da API OpenAI

### Passo 4: Deploy

1. Clique em **"Deploy"** ou **"Create"**
2. O EasyPanel irá:
   - Criar o serviço MySQL automaticamente
   - Criar o serviço da aplicação
   - Configurar as variáveis de ambiente
   - Executar as migrações do banco automaticamente
3. Aguarde o deploy completar (pode levar alguns minutos)

### Passo 5: Configurar Domínio

1. No serviço da aplicação, vá em **"Domains"**
2. Adicione seu domínio ou use o subdomínio do EasyPanel
3. Habilite SSL/TLS (Let's Encrypt)
4. Salve as alterações

### Passo 6: Verificar Deploy

1. Acesse a aplicação via domínio configurado
2. Faça login com suas credenciais OAuth (Manus)
3. Teste o upload de um documento
4. Verifique se o processamento está funcionando

---

## 🔧 Opção 2: Deploy Manual no EasyPanel

### Passo 1: Criar Projeto

1. No EasyPanel, clique em **"New Project"**
2. Nomeie o projeto: `rag-knowledge-base`

### Passo 2: Criar Banco de Dados MySQL

1. No projeto, clique em **"Add Service"**
2. Escolha **"MySQL"**
3. Configure:
   - **Service Name**: `rag-mysql`
   - **Version**: `8.0` (ou a mais recente)
   - **Database Name**: Use o nome do projeto ou `rag_knowledge_base`
   - **Username**: `root` (padrão)
   - **Password**: Gere uma senha segura (anote esta senha!)
4. Clique em **"Create"**
5. Aguarde o MySQL estar pronto

### Passo 3: Criar Aplicação

1. Clique em **"Add Service"** novamente
2. Escolha **"App"** ou **"Docker"**
3. Configure:

   **Source:**
   - Se você tem a imagem no Docker Hub: Use **"Docker Image"**
     - **Image**: `seu-usuario/rag-knowledge-base:latest`
   - Se você quer fazer build: Use **"Git Repository"** ou **"Dockerfile"**
     - **Build Context**: Aponte para o diretório do projeto
     - **Dockerfile Path**: `./Dockerfile`

   **Ports:**
   - **Port**: `3000`

   **Domains:**
   - Adicione seu domínio ou subdomínio
   - Habilite SSL

### Passo 4: Configurar Variáveis de Ambiente

Na aba **"Environment"** da aplicação, adicione:

```env
# Database Connection (MySQL)
DATABASE_URL=mysql://root:SUA_SENHA_MYSQL@rag-mysql:3306/rag_knowledge_base
DB_HOST=rag-mysql
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL
DB_NAME=rag_knowledge_base

# OpenAI API (OBRIGATÓRIO)
OPENAI_API_KEY=sk-proj-...

# JWT Secret (gerado automaticamente pelo template, mas você pode definir manualmente)
JWT_SECRET=SUA_CHAVE_JWT_ALEATORIA_AQUI

# OAuth (Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# App Configuration
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
VITE_APP_LOGO=

# Owner Info
OWNER_OPEN_ID=
OWNER_NAME=Admin

# Node Environment
NODE_ENV=production
```

**Importante:**
- Substitua `SUA_SENHA_MYSQL` pela senha que você configurou no MySQL
- Substitua `sk-proj-...` pela sua chave OpenAI real
- Para gerar `JWT_SECRET`, use: `openssl rand -base64 32`

### Passo 5: Configurar Volumes

Na aba **"Volumes"**, adicione:

- **Name**: `data`
- **Mount Path**: `/app/data`
- **Type**: `Volume`

### Passo 6: Deploy

1. Clique em **"Deploy"** ou **"Save"**
2. Aguarde o build e inicialização
3. As migrações do banco serão executadas automaticamente via `init-db.sh`

### Passo 7: Verificar Logs

1. Vá na aba **"Logs"** do serviço da aplicação
2. Verifique se aparecem mensagens como:
   - `✅ Banco de dados está pronto!`
   - `🚀 Executando migrações do banco de dados...`
   - `✅ Migrações concluídas com sucesso!`
   - `🚀 Iniciando aplicação...`

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se o serviço MySQL está rodando
2. Confirme que a `DATABASE_URL` está correta
3. Verifique se o nome do serviço MySQL está correto na URL (deve ser `rag-mysql` ou o nome que você usou)
4. Teste a conexão manualmente:
   ```bash
   # No terminal do container da aplicação
   mysql -h rag-mysql -u root -p
   ```

### Erro: "OpenAI API key invalid"

**Solução:**
1. Verifique se `OPENAI_API_KEY` está configurada corretamente
2. Confirme que a chave tem créditos disponíveis
3. Teste a chave:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Erro: "Migrations failed"

**Solução:**
1. Verifique os logs do container
2. Confirme que o banco MySQL está acessível
3. Tente executar as migrações manualmente:
   ```bash
   # No terminal do container da aplicação
   pnpm db:push
   ```

### Container reiniciando constantemente

**Solução:**
1. Verifique os logs para identificar o erro
2. Confirme que todas as variáveis de ambiente obrigatórias estão configuradas
3. Verifique se o banco MySQL está pronto antes da aplicação iniciar

### Aplicação não responde

**Solução:**
1. Verifique se a porta 3000 está exposta corretamente
2. Confirme que o domínio está configurado corretamente
3. Teste o health check:
   ```bash
   curl http://seu-dominio/api/health
   ```

---

## 📊 Monitoramento

### Ver Logs

No EasyPanel:
1. Acesse o serviço da aplicação
2. Vá na aba **"Logs"**
3. Você verá logs em tempo real

### Verificar Status do Banco

1. Acesse o serviço MySQL
2. Vá na aba **"Logs"** para ver logs do banco
3. Use **"Terminal"** para acessar o MySQL:
   ```sql
   USE rag_knowledge_base;
   SHOW TABLES;
   ```

### Health Check

A aplicação expõe um endpoint de health check:

```bash
curl http://seu-dominio/api/health
# Resposta esperada: {"status":"ok"}
```

---

## 🔄 Atualizações

### Atualizar Aplicação

1. Faça build da nova imagem:
   ```bash
   docker build -t seu-usuario/rag-knowledge-base:latest .
   docker push seu-usuario/rag-knowledge-base:latest
   ```

2. No EasyPanel:
   - Acesse o serviço da aplicação
   - Clique em **"Redeploy"** ou **"Restart"**
   - Ou atualize a tag da imagem e faça redeploy

### Executar Migrações Manuais

Se necessário, você pode executar migrações manualmente:

1. Acesse o terminal do container da aplicação
2. Execute:
   ```bash
   pnpm db:push
   ```

---

## 🔐 Segurança

### Recomendações

1. **Senhas Fortes**: Use senhas complexas para MySQL e JWT_SECRET
2. **SSL/TLS**: Sempre use HTTPS em produção
3. **Firewall**: Bloqueie portas desnecessárias
4. **Backups**: Configure backups automáticos do MySQL
5. **Variáveis de Ambiente**: Nunca commite arquivos `.env` no Git

### Gerar JWT Secret Seguro

```bash
openssl rand -base64 32
```

---

## 📚 Recursos Adicionais

- [Documentação EasyPanel](https://easypanel.io/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a seção de Troubleshooting acima
2. Consulte os logs da aplicação e do banco
3. Verifique as variáveis de ambiente
4. Teste a conectividade do banco de dados

---

**Desenvolvido com ❤️ usando Manus AI**
