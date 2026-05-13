# 🔐 Configurar Credenciais do MinIO Community Edition

## ✅ Não é um problema!

O MinIO Community Edition funciona perfeitamente com o projeto. A diferença é apenas na forma de configurar as credenciais.

## 🔑 Como Funciona

O MinIO usa duas credenciais:
- **Access Key** (usuário) - equivalente ao `MINIO_ROOT_USER`
- **Secret Key** (senha) - equivalente ao `MINIO_ROOT_PASSWORD`

## 📋 Opções para Configurar

### Opção 1: Via Variáveis de Ambiente no EasyPanel (Recomendado)

No serviço MinIO no EasyPanel, configure:

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=sua-senha-segura-aqui
```

**Depois, na aplicação RAG, use os mesmos valores:**
```env
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=sua-senha-segura-aqui
```

### Opção 2: Usar Credenciais Padrão

Se você não configurou nada, o MinIO usa as credenciais padrão:

```env
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

⚠️ **Atenção**: Mude essas credenciais em produção!

### Opção 3: Criar Usuário via Console MinIO

1. **Acesse o Console MinIO**: `http://seu-servidor:9001`
2. **Login** com as credenciais atuais (padrão: `minioadmin` / `minioadmin123`)
3. **Vá em "Identity" → "Users"**
4. **Crie um novo usuário** ou use o root user
5. **Use as credenciais** na aplicação

## 🎯 Configuração Completa

### No Serviço MinIO (EasyPanel)

**Variáveis de Ambiente:**
```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

### Na Aplicação RAG (EasyPanel)

**Variáveis de Ambiente:**
```env
MINIO_ENDPOINT=nome-do-servico-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=rag-documents
```

**Importante**: 
- `MINIO_ACCESS_KEY` = mesmo valor de `MINIO_ROOT_USER`
- `MINIO_SECRET_KEY` = mesmo valor de `MINIO_ROOT_PASSWORD`

## 🔍 Como Descobrir as Credenciais

### Se você já tem MinIO rodando:

1. **Acesse o Console**: `http://seu-servidor:9001`
2. **Tente fazer login**:
   - Se conseguir com `minioadmin` / `minioadmin123` → use essas
   - Se não conseguir → veja as variáveis de ambiente do serviço MinIO no EasyPanel

### Se está criando agora:

1. **Configure no EasyPanel** ao criar o serviço MinIO:
   ```env
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=senha-segura-123
   ```

2. **Use os mesmos valores na aplicação**:
   ```env
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=senha-segura-123
   ```

## ✅ Teste de Conexão

Para testar se está funcionando:

1. **Acesse o Console MinIO**: `http://seu-servidor:9001`
2. **Faça login** com `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`
3. **Confirme que o bucket `rag-documents` existe**

Se conseguir acessar, está tudo certo! 🎉

## 🚨 Problemas Comuns

### Erro: "Access Denied"

**Solução**: Verifique se `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` estão corretos e são os mesmos do serviço MinIO.

### Erro: "Cannot connect to MinIO"

**Solução**: 
1. Verifique se `MINIO_ENDPOINT` está correto (nome do serviço)
2. Confirme que MinIO está rodando
3. Teste a conectividade

### Não consigo acessar o Console

**Solução**: 
1. Verifique a porta (9001)
2. Confirme as credenciais padrão: `minioadmin` / `minioadmin123`
3. Veja os logs do serviço MinIO no EasyPanel

## 📝 Resumo

1. **MinIO Community Edition funciona perfeitamente** ✅
2. **Configure `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD` no serviço MinIO**
3. **Use os mesmos valores como `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` na aplicação**
4. **Pronto!** 🚀

---

**Dica**: Se não conseguir descobrir as credenciais, use as padrão (`minioadmin` / `minioadmin123`) e depois mude para algo mais seguro em produção.
