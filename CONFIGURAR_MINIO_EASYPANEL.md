# 🪣 Configurar MinIO no EasyPanel

## 📋 Sobre as Mensagens do PostgreSQL

As mensagens que você está vendo são **normais**:

1. ✅ `"PostgreSQL Database directory appears to contain a database"` - O banco já existe (não é problema)
2. ✅ `"database system is ready to accept connections"` - PostgreSQL está funcionando perfeitamente
3. ⚠️ `"database 'saas_admin' does not exist"` - Outro serviço/aplicação está tentando conectar a um banco diferente (não afeta nosso projeto)

**O projeto RAG usa o banco `rag_knowledge_base`** (ou o nome do seu projeto), não `saas_admin`.

## 🚀 Configurar MinIO no EasyPanel

### Opção 1: Via Template (Recomendado)

O template já está configurado! Quando você usar o template "RAG Knowledge Base", o MinIO será criado automaticamente.

### Opção 2: Manual no EasyPanel

Se preferir criar manualmente:

#### Passo 1: Criar Serviço MinIO

1. No EasyPanel, vá no seu projeto
2. Clique em **"Add Service"**
3. Escolha **"App"** ou **"Docker"**
4. Configure:
   - **Service Name**: `minio`
   - **Image**: `minio/minio:latest`
   - **Command**: `server /data --console-address ":9001"`
   - **Ports**:
     - `9000` (API)
     - `9001` (Console)

#### Passo 2: Configurar Variáveis de Ambiente

Na aba **"Environment"** do serviço MinIO:

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=sua-senha-segura-aqui
```

**Importante**: Anote essas credenciais! Você precisará delas para configurar a aplicação.

#### Passo 3: Configurar Volume

Na aba **"Volumes"**:
- **Name**: `minio-data`
- **Mount Path**: `/data`
- **Type**: `Volume`

#### Passo 4: Configurar na Aplicação RAG

Na aplicação RAG, adicione as variáveis MinIO:

```env
MINIO_ENDPOINT=rag-minio  # ou o nome do serviço MinIO
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin  # Mesmo valor de MINIO_ROOT_USER
MINIO_SECRET_KEY=sua-senha-segura-aqui  # Mesmo valor de MINIO_ROOT_PASSWORD
MINIO_BUCKET_NAME=rag-documents
```

**Nota**: Se o MinIO estiver no mesmo projeto, use `$(PROJECT_NAME)_minio` como endpoint.

## 🔧 Verificar se MinIO está Funcionando

### 1. Acessar Console MinIO

Após criar o serviço, acesse:
- **URL**: `http://seu-servidor:9001` ou `https://minio.seu-dominio.com:9001`
- **Usuário**: `minioadmin` (ou o que você configurou)
- **Senha**: A senha que você configurou

### 2. Criar Bucket

No console MinIO:
1. Clique em **"Buckets"**
2. Clique em **"Create Bucket"**
3. Nome: `rag-documents`
4. Clique em **"Create Bucket"**

### 3. Testar Conexão

Você pode testar a conexão usando curl:

```bash
curl http://minio-endpoint:9000/minio/health/live
```

Deve retornar: `OK`

## 📝 Variáveis de Ambiente Completas

Para a aplicação RAG funcionar, você precisa de:

### Obrigatórias:
```env
DATABASE_URL=postgresql://postgres:senha@rag-postgres:5432/rag_knowledge_base
OPENAI_API_KEY=sk-proj-...
JWT_SECRET=chave-aleatoria-segura
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=sua-senha-minio
```

### Opcionais (com valores padrão):
```env
MINIO_ENDPOINT=rag-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=rag-documents
```

## 🐛 Troubleshooting

### MinIO não inicia

- Verifique se a porta 9000/9001 não está em uso
- Verifique os logs: `docker logs rag-minio`
- Confirme que o volume está montado corretamente

### Aplicação não consegue conectar ao MinIO

- Verifique se `MINIO_ENDPOINT` está correto (nome do serviço)
- Confirme que MinIO e App estão na mesma rede
- Teste a conectividade: `ping rag-minio` (do container da app)

### Bucket não existe

- Crie o bucket `rag-documents` no console MinIO
- Ou o código criará automaticamente na primeira execução

## ✅ Checklist

- [ ] MinIO criado no EasyPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Volume montado em `/data`
- [ ] Portas 9000 e 9001 expostas
- [ ] Console acessível
- [ ] Bucket `rag-documents` criado
- [ ] Variáveis MinIO configuradas na aplicação RAG
- [ ] Teste de conexão bem-sucedido

---

**Pronto!** Com isso, o MinIO estará configurado e funcionando! 🎉
