# 🚀 Guia Passo a Passo: Deploy no EasyPanel

Este guia detalha o processo completo de deploy do sistema RAG Knowledge Base no seu servidor VPS com EasyPanel.

---

## 📋 Pré-requisitos

- Servidor VPS com EasyPanel instalado
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)
- Chave API da OpenAI

---

## 🔧 Passo 1: Preparar o Servidor

### 1.1 Conectar via SSH

```bash
ssh usuario@seu-servidor-ip
```

### 1.2 Verificar Docker e Docker Compose

```bash
docker --version
docker-compose --version
```

Se não estiverem instalados, o EasyPanel já deve ter configurado. Caso contrário:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## 📦 Passo 2: Fazer Upload do Projeto

### Opção A: Via Git (Recomendado)

1. Criar repositório no GitHub/GitLab
2. Fazer push do código:

```bash
cd /caminho/do/projeto/rag_knowledge_base
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/rag-knowledge-base.git
git push -u origin main
```

3. No servidor, clonar o repositório:

```bash
cd /home/seu-usuario
git clone https://github.com/seu-usuario/rag-knowledge-base.git
cd rag-knowledge_base
```

### Opção B: Via SCP (Upload Direto)

```bash
# No seu computador local
cd /caminho/do/projeto
tar -czf rag_knowledge_base.tar.gz rag_knowledge_base/
scp rag_knowledge_base.tar.gz usuario@seu-servidor-ip:/home/usuario/

# No servidor
cd /home/usuario
tar -xzf rag_knowledge_base.tar.gz
cd rag_knowledge_base
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env

```bash
cd /home/usuario/rag_knowledge_base
nano .env
```

### 3.2 Adicionar as seguintes variáveis:

```env
# ==================== BANCO DE DADOS ====================
MYSQL_ROOT_PASSWORD=SuaSenhaSegura123!
MYSQL_DATABASE=rag_knowledge_base
MYSQL_USER=raguser
MYSQL_PASSWORD=OutraSenhaSegura456!
MYSQL_PORT=3306

# ==================== OPENAI ====================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==================== AUTENTICAÇÃO ====================
JWT_SECRET=gere-uma-string-aleatoria-muito-longa-e-segura
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# ==================== APLICAÇÃO ====================
APP_PORT=3000
VITE_APP_ID=rag-knowledge-base
VITE_APP_TITLE=RAG Knowledge Base
VITE_APP_LOGO=

# ==================== PROPRIETÁRIO (ADMIN) ====================
OWNER_OPEN_ID=seu-open-id-do-manus
OWNER_NAME=Seu Nome

# ==================== MANUS APIs (Opcional) ====================
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=

# ==================== ANALYTICS (Opcional) ====================
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# ==================== NODE ====================
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- Substitua `SuaSenhaSegura123!` por senhas fortes e únicas
- Obtenha sua `OPENAI_API_KEY` em https://platform.openai.com/api-keys
- Para gerar `JWT_SECRET` seguro:
  ```bash
  openssl rand -base64 64
  ```

### 3.3 Salvar e fechar (Ctrl+X, Y, Enter)

---

## 🐳 Passo 4: Build e Deploy com Docker Compose

### 4.1 Fazer build das imagens

```bash
docker-compose build --no-cache
```

**Tempo estimado:** 5-10 minutos (dependendo da conexão)

### 4.2 Iniciar os serviços

```bash
docker-compose up -d
```

### 4.3 Verificar status dos containers

```bash
docker-compose ps
```

Você deve ver:
```
NAME                COMMAND                  SERVICE             STATUS
rag-mysql           "docker-entrypoint.s…"   db                  Up (healthy)
rag-app             "/app/scripts/init-d…"   app                 Up
```

### 4.4 Verificar logs

```bash
# Logs do aplicativo
docker-compose logs -f app

# Logs do banco de dados
docker-compose logs -f db
```

**Aguarde até ver:**
```
✅ Banco de dados está pronto!
🚀 Executando migrações do banco de dados...
✅ Migrações concluídas com sucesso!
🚀 Iniciando aplicação...
Server running on http://localhost:3000/
```

---

## 🌐 Passo 5: Configurar no EasyPanel

### 5.1 Acessar EasyPanel

Abra seu navegador e acesse: `http://seu-servidor-ip:3000` (porta do EasyPanel, geralmente 3000 ou 8080)

### 5.2 Criar Novo Projeto

1. Clique em **"New Project"**
2. Escolha **"From Docker Compose"**
3. Cole o conteúdo do arquivo `docker-compose.yml`
4. Configure as variáveis de ambiente (mesmas do `.env`)

### 5.3 Configurar Domínio

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio: `rag.seudominio.com`
3. Configure DNS no seu provedor:
   ```
   Tipo: A
   Nome: rag
   Valor: IP-DO-SEU-SERVIDOR
   TTL: 3600
   ```
4. Aguarde propagação DNS (5-30 minutos)

### 5.4 Habilitar HTTPS (SSL)

1. No EasyPanel, vá em **Settings** → **SSL**
2. Clique em **"Enable SSL"**
3. Escolha **"Let's Encrypt"** (gratuito)
4. Aguarde certificado ser gerado

---

## ✅ Passo 6: Testar o Sistema

### 6.1 Acessar a aplicação

Abra: `https://rag.seudominio.com` (ou `http://seu-servidor-ip:3000`)

### 6.2 Fazer login

Use suas credenciais do Manus OAuth

### 6.3 Testar upload de documento

1. Vá em **"Upload de Documentos"**
2. Faça upload de um PDF de teste
3. Aguarde processamento
4. Verifique se aparece em **"Base de Conhecimento"**

### 6.4 Testar busca semântica

1. Vá em **"Busca Semântica"**
2. Digite uma query relacionada ao documento
3. Verifique se retorna resultados relevantes

### 6.5 Testar chat RAG

1. Vá em **"Chat com IA"**
2. Faça uma pergunta sobre o documento
3. Verifique se a IA responde com base no conteúdo

---

## 🔍 Passo 7: Monitoramento e Manutenção

### 7.1 Verificar saúde dos containers

```bash
docker-compose ps
docker stats
```

### 7.2 Ver logs em tempo real

```bash
docker-compose logs -f
```

### 7.3 Reiniciar serviços

```bash
# Reiniciar apenas o app
docker-compose restart app

# Reiniciar tudo
docker-compose restart
```

### 7.4 Parar serviços

```bash
docker-compose down
```

### 7.5 Atualizar aplicação

```bash
# Fazer pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Problema: Container não inicia

**Solução:**
```bash
docker-compose logs app
docker-compose logs db
```

Verifique erros de conexão com banco ou variáveis de ambiente faltando.

### Problema: Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar se o MySQL está rodando
docker-compose ps db

# Testar conexão manualmente
docker exec -it rag-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

### Problema: Migrações não executam

**Solução:**
```bash
# Entrar no container
docker exec -it rag-app sh

# Executar migrações manualmente
pnpm db:push
```

### Problema: Processamento de PDF falha

**Solução:**
Verifique se as dependências estão instaladas:
```bash
docker exec -it rag-app sh
tesseract --version
```

### Problema: OpenAI API retorna erro 401

**Solução:**
Verifique se a chave API está correta no `.env`:
```bash
grep OPENAI_API_KEY .env
```

---

## 📊 Passo 8: Configurações Avançadas

### 8.1 Aumentar limite de upload

Edite `server/_core/index.ts` e ajuste:
```typescript
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
```

### 8.2 Configurar backup automático do banco

```bash
# Criar script de backup
nano /home/usuario/backup-db.sh
```

Conteúdo:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec rag-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} rag_knowledge_base > /home/usuario/backups/rag_backup_$DATE.sql
```

Agendar com cron:
```bash
crontab -e
# Adicionar linha:
0 2 * * * /home/usuario/backup-db.sh
```

### 8.3 Configurar logs persistentes

Edite `docker-compose.yml` e adicione:
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🎉 Conclusão

Seu sistema RAG Knowledge Base está rodando em produção! 

**Próximos passos:**
1. Configure domínio personalizado
2. Habilite SSL/HTTPS
3. Configure backups automáticos
4. Monitore logs e performance
5. Teste com documentos reais da sua empresa

**Suporte:**
- Documentação da API: `API_DOCUMENTATION.md`
- Variáveis de ambiente: `ENVIRONMENT_VARIABLES.md`
- Troubleshooting: `DEPLOY.md`

---

## 📞 Contato

Se encontrar problemas, verifique:
1. Logs do Docker: `docker-compose logs`
2. Status dos serviços: `docker-compose ps`
3. Variáveis de ambiente: `cat .env`

**Boa sorte com seu deploy! 🚀**
