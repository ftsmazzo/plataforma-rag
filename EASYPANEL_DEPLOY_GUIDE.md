# Guia Completo de Deploy no EasyPanel

Este guia fornece instruções passo a passo para fazer deploy do sistema RAG Knowledge Base no EasyPanel usando sua VPS.

## Pré-requisitos

- VPS com EasyPanel instalado e funcionando
- Acesso ao painel do EasyPanel (normalmente em `https://seu-dominio:3000`)
- Chave API da OpenAI
- Domínio ou subdomínio configurado (opcional, mas recomendado)

## Opção 1: Deploy via Docker Compose (Recomendado)

### Passo 1: Preparar Arquivos

1. Faça upload dos seguintes arquivos para sua VPS:
   - `docker-compose.yml`
   - `Dockerfile`
   - `.env.example` (renomeie para `.env`)
   - Todo o código fonte do projeto

2. Conecte via SSH à sua VPS:
```bash
ssh usuario@seu-servidor.com
```

3. Crie um diretório para o projeto:
```bash
mkdir -p /home/usuario/rag_knowledge_base
cd /home/usuario/rag_knowledge_base
```

4. Faça upload dos arquivos (use `scp`, `rsync` ou Git):
```bash
# Opção 1: Via SCP (do seu computador local)
scp -r /caminho/local/rag_knowledge_base/* usuario@seu-servidor.com:/home/usuario/rag_knowledge_base/

# Opção 2: Via Git (se você tiver um repositório)
git clone https://seu-repositorio.git .
```

### Passo 2: Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env`:
```bash
nano .env
```

3. Preencha as variáveis obrigatórias:
```env
# OpenAI API
OPENAI_API_KEY=sk-...

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://rag_user:senha_segura_aqui@postgres:5432/rag_db
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=senha_segura_aqui
POSTGRES_DB=rag_db

# JWT Secret (gere uma chave aleatória)
JWT_SECRET=sua_chave_secreta_jwt_muito_longa_e_aleatoria

# OAuth (se usar autenticação Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=seu_app_id

# Proprietário
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=Seu Nome
```

**Dica**: Para gerar uma chave JWT segura:
```bash
openssl rand -base64 32
```

### Passo 3: Build e Deploy

1. Construa as imagens Docker:
```bash
docker-compose build
```

2. Inicie os serviços:
```bash
docker-compose up -d
```

3. Verifique se os containers estão rodando:
```bash
docker-compose ps
```

Você deve ver 2 containers:
- `rag_knowledge_base-app-1` (aplicação)
- `rag_knowledge_base-postgres-1` (banco de dados)

4. Verifique os logs:
```bash
docker-compose logs -f app
```

### Passo 4: Inicializar Banco de Dados

1. Execute as migrações do banco:
```bash
docker-compose exec app pnpm db:push
```

2. Verifique se as tabelas foram criadas:
```bash
docker-compose exec postgres psql -U rag_user -d rag_db -c "\dt"
```

### Passo 5: Configurar Domínio no EasyPanel

1. Acesse o painel do EasyPanel
2. Vá em **Domains** ou **Proxy**
3. Adicione um novo domínio/subdomínio apontando para `localhost:3000`
4. Configure SSL/TLS (Let's Encrypt)

Exemplo de configuração Nginx no EasyPanel:
```nginx
server {
    listen 80;
    server_name rag.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Passo 6: Testar Aplicação

1. Acesse sua aplicação via navegador:
```
https://rag.seu-dominio.com
```

2. Faça login e teste o upload de um documento
3. Verifique se o processamento está funcionando
4. Teste a busca semântica e o chat

---

## Opção 2: Deploy via EasyPanel Template

### Passo 1: Preparar Template

1. Crie um repositório Git com o código
2. Faça push do código incluindo a pasta `easypanel/`

### Passo 2: Adicionar Template no EasyPanel

1. No EasyPanel, vá em **Templates**
2. Clique em **Add Custom Template**
3. Cole o conteúdo do arquivo `easypanel/meta.yaml`
4. Salve o template

### Passo 3: Deploy via Template

1. No EasyPanel, clique em **Create New App**
2. Selecione o template "RAG Knowledge Base"
3. Preencha as variáveis de ambiente solicitadas
4. Clique em **Deploy**

---

## Opção 3: Deploy Manual no EasyPanel

### Passo 1: Criar Aplicação

1. No EasyPanel, clique em **Create New App**
2. Escolha **Docker** como tipo
3. Nomeie a aplicação: `rag-knowledge-base`

### Passo 2: Configurar Container

1. **Image**: Deixe em branco (vamos usar build)
2. **Build Context**: Aponte para o diretório do projeto
3. **Dockerfile Path**: `./Dockerfile`

### Passo 3: Adicionar Banco de Dados

1. No EasyPanel, vá em **Databases**
2. Clique em **Create Database**
3. Escolha **PostgreSQL 16**
4. Nomeie: `rag-postgres`
5. Anote as credenciais geradas

### Passo 4: Configurar Variáveis de Ambiente

Na aba **Environment** da aplicação, adicione:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://usuario:senha@rag-postgres:5432/rag_db
JWT_SECRET=sua_chave_jwt
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=seu_app_id
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=Seu Nome
NODE_ENV=production
PORT=3000
```

### Passo 5: Configurar Volumes

Adicione volumes persistentes:
- `/app/uploads` → Para armazenar arquivos temporários

### Passo 6: Configurar Rede

1. Exponha a porta `3000`
2. Configure domínio personalizado
3. Habilite SSL/TLS

### Passo 7: Deploy

1. Clique em **Deploy**
2. Aguarde o build e inicialização
3. Verifique logs na aba **Logs**

---

## Opção 4: Deploy via Docker Registry

### Passo 1: Build e Push da Imagem

No seu computador local:

```bash
# Build da imagem
docker build -t seu-usuario/rag-knowledge-base:latest .

# Login no Docker Hub
docker login

# Push da imagem
docker push seu-usuario/rag-knowledge-base:latest
```

### Passo 2: Deploy no EasyPanel

1. No EasyPanel, crie nova aplicação
2. Use a imagem: `seu-usuario/rag-knowledge-base:latest`
3. Configure variáveis de ambiente
4. Configure banco de dados PostgreSQL
5. Deploy

---

## Troubleshooting

### Erro: "Cannot connect to database"

**Solução**:
1. Verifique se o container do PostgreSQL está rodando:
```bash
docker-compose ps postgres
```

2. Teste a conexão:
```bash
docker-compose exec postgres psql -U rag_user -d rag_db -c "SELECT 1"
```

3. Verifique a `DATABASE_URL` no `.env`

### Erro: "OpenAI API key not configured"

**Solução**:
1. Verifique se `OPENAI_API_KEY` está definida no `.env`
2. Reinicie a aplicação:
```bash
docker-compose restart app
```

### Erro: "Port 3000 already in use"

**Solução**:
1. Mude a porta no `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Mude 3000 para 3001
```

2. Reinicie:
```bash
docker-compose down && docker-compose up -d
```

### Erro ao processar PDF: "pdf-parse error"

**Solução**:
1. Verifique se as bibliotecas estão instaladas no container:
```bash
docker-compose exec app pnpm list pdfjs-dist
```

2. Rebuild da imagem:
```bash
docker-compose build --no-cache app
docker-compose up -d
```

### Erro de OCR: "tesseract not found"

**Solução**:
1. Verifique se Tesseract está instalado:
```bash
docker-compose exec app tesseract --version
```

2. Se não estiver, rebuild com:
```bash
docker-compose build --no-cache
```

### Container reiniciando constantemente

**Solução**:
1. Verifique os logs:
```bash
docker-compose logs --tail=100 app
```

2. Verifique health check:
```bash
docker inspect rag_knowledge_base-app-1 | grep -A 10 Health
```

---

## Manutenção

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose exec postgres pg_dump -U rag_user rag_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U rag_user -d rag_db < backup_20250107.sql
```

### Atualizar Aplicação

```bash
# Pull das últimas alterações
git pull origin main

# Rebuild e restart
docker-compose build
docker-compose up -d

# Executar migrações se necessário
docker-compose exec app pnpm db:push
```

### Monitorar Logs

```bash
# Logs em tempo real
docker-compose logs -f app

# Últimas 100 linhas
docker-compose logs --tail=100 app

# Logs do banco
docker-compose logs postgres
```

### Limpar Dados Antigos

```bash
# Remover documentos antigos (SQL)
docker-compose exec postgres psql -U rag_user -d rag_db -c "
DELETE FROM documents WHERE createdAt < NOW() - INTERVAL '90 days';
"

# Limpar volumes não utilizados
docker volume prune
```

---

## Segurança

### Recomendações

1. **Firewall**: Bloqueie portas desnecessárias
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

2. **Senha forte**: Use senhas complexas para PostgreSQL

3. **JWT Secret**: Use chave longa e aleatória

4. **SSL/TLS**: Sempre use HTTPS em produção

5. **Backup**: Configure backups automáticos diários

6. **Atualizações**: Mantenha Docker e sistema operacional atualizados

---

## Recursos Adicionais

- [Documentação do EasyPanel](https://easypanel.io/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs)

---

## Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte a seção Troubleshooting acima
3. Verifique as variáveis de ambiente
4. Teste a conectividade do banco de dados

Para problemas específicos do EasyPanel, consulte a documentação oficial ou o suporte da plataforma.
