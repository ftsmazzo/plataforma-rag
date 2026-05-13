# ⚡ Guia Rápido - MinIO no EasyPanel

## 🎯 Resumo

As mensagens do PostgreSQL são **normais**. O erro sobre `saas_admin` é de outro serviço, não afeta nosso projeto.

## 🚀 Setup Rápido MinIO

### No EasyPanel:

1. **Criar Serviço MinIO**
   - Tipo: Docker
   - Image: `minio/minio:latest`
   - Command: `server /data --console-address ":9001"`
   - Portas: `9000` e `9001`

2. **Variáveis de Ambiente MinIO**
   ```
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=senha-segura-123
   ```

3. **Volume**
   - Path: `/data`
   - Type: Volume

4. **Na Aplicação RAG, adicionar:**
   ```
   MINIO_ENDPOINT=nome-do-servico-minio
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=senha-segura-123
   MINIO_BUCKET_NAME=rag-documents
   ```

## ✅ Pronto!

O MinIO estará funcionando. O bucket será criado automaticamente na primeira execução.
