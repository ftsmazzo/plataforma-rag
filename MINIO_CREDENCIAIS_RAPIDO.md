# ⚡ MinIO Credenciais - Resumo Rápido

## 🎯 Solução Rápida

O MinIO Community Edition funciona normalmente! Só precisa configurar as credenciais.

## 📋 Configuração

### No Serviço MinIO (EasyPanel):
```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=senha-segura-123
```

### Na Aplicação RAG (EasyPanel):
```env
MINIO_ACCESS_KEY=minioadmin          # Mesmo valor de MINIO_ROOT_USER
MINIO_SECRET_KEY=senha-segura-123     # Mesmo valor de MINIO_ROOT_PASSWORD
MINIO_ENDPOINT=nome-servico-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=rag-documents
```

## ✅ Se não configurou nada:

Use as credenciais padrão:
```env
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

## 🔍 Como descobrir:

1. Acesse o Console MinIO: `http://seu-servidor:9001`
2. Tente login com `minioadmin` / `minioadmin123`
3. Se funcionar, use essas credenciais na aplicação

---

**Pronto!** Não é problema, só precisa configurar as credenciais corretas! 🚀
