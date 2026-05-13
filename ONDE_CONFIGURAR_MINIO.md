# 📍 Onde Configurar Cada Variável do MinIO

## 🎯 Resumo Rápido

- **No Serviço MinIO**: `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`
- **Na Aplicação RAG**: `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` (usando os mesmos valores)

## 🔧 Configuração Detalhada

### 1️⃣ No Serviço MinIO (EasyPanel)

Vá no serviço MinIO → **"Environment Variables"** → Adicione:

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=sua-senha-segura-123
```

**Essas variáveis configuram o MinIO em si** (usuário e senha do MinIO).

### 2️⃣ Na Aplicação RAG (EasyPanel)

Vá na aplicação RAG → **"Environment Variables"** → Adicione:

```env
MINIO_ENDPOINT=nome-do-servico-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=sua-senha-segura-123
MINIO_BUCKET_NAME=rag-documents
```

**Essas variáveis são para a aplicação se conectar ao MinIO.**

## ⚠️ Importante

**`MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` devem ter os MESMOS valores de `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`!**

- `MINIO_ACCESS_KEY` = mesmo valor de `MINIO_ROOT_USER`
- `MINIO_SECRET_KEY` = mesmo valor de `MINIO_ROOT_PASSWORD`

## 📋 Exemplo Completo

### Serviço MinIO:
```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minhasenha123
```

### Aplicação RAG:
```env
MINIO_ACCESS_KEY=minioadmin        # ← Mesmo valor de MINIO_ROOT_USER
MINIO_SECRET_KEY=minhasenha123     # ← Mesmo valor de MINIO_ROOT_PASSWORD
MINIO_ENDPOINT=rag-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=rag-documents
```

## ✅ Checklist

- [ ] Configurei `MINIO_ROOT_USER` no serviço MinIO
- [ ] Configurei `MINIO_ROOT_PASSWORD` no serviço MinIO
- [ ] Configurei `MINIO_ACCESS_KEY` na aplicação RAG (mesmo valor de `MINIO_ROOT_USER`)
- [ ] Configurei `MINIO_SECRET_KEY` na aplicação RAG (mesmo valor de `MINIO_ROOT_PASSWORD`)
- [ ] Configurei `MINIO_ENDPOINT` na aplicação RAG (nome do serviço MinIO)
- [ ] Configurei `MINIO_BUCKET_NAME` na aplicação RAG

## 🎯 Resumo Visual

```
┌─────────────────────┐
│  Serviço MinIO      │
│                     │
│ MINIO_ROOT_USER     │ ───┐
│ MINIO_ROOT_PASSWORD │ ───┤
└─────────────────────┘    │
                            │ (mesmos valores)
┌─────────────────────┐     │
│  Aplicação RAG      │     │
│                     │     │
│ MINIO_ACCESS_KEY    │ ←───┘
│ MINIO_SECRET_KEY    │ ←───┘
│ MINIO_ENDPOINT      │
│ MINIO_PORT          │
│ MINIO_BUCKET_NAME   │
└─────────────────────┘
```

---

**Resumo**: Você cria `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` **na aplicação RAG**, usando os mesmos valores que configurou no serviço MinIO! 🚀
