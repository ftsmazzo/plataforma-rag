# Solução: Erro de Conexão MinIO - Porta Incorreta

## Problema

O erro `connect ECONNREFUSED` na porta 9001 indica que:
1. A porta está incorreta (deve ser 9000, não 9001)
2. Ou o MinIO está rodando em outra porta

## Solução

### 1. Verificar a Porta do MinIO

No EasyPanel, verifique qual porta o serviço MinIO está usando:
- Vá no serviço MinIO
- Veja a configuração de portas
- Geralmente é **9000** para API e **9001** para Console

### 2. Configurar Corretamente

Na aplicação RAG, configure:

```env
MINIO_ENDPOINT=saas-agentes-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=seu-access-key
MINIO_SECRET_KEY=seu-secret-key
MINIO_BUCKET_NAME=rag-documents
```

**Importante:**
- Use apenas o **nome do serviço** (`saas-agentes-minio`) ao invés do domínio completo
- Use a porta **9000** (API), não 9001 (Console)
- Se estiver na mesma rede Docker, `MINIO_USE_SSL=false`

### 3. Alternativa: Usar IP Interno

Se o nome do serviço não funcionar, você pode:

1. **Descobrir o IP interno do MinIO:**
   - No console do container MinIO, execute: `hostname -i`
   - Ou veja nas configurações do serviço no EasyPanel

2. **Usar o IP diretamente:**
   ```env
   MINIO_ENDPOINT=IP_INTERNO_DO_MINIO
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   ```

### 4. Verificar Conectividade

No console do container da aplicação, teste:

```bash
# Testar conexão
nc -zv saas-agentes-minio 9000

# Ou com telnet
telnet saas-agentes-minio 9000
```

## Checklist

- [ ] Porta configurada como **9000** (não 9001)
- [ ] `MINIO_ENDPOINT` usando apenas o nome do serviço (sem domínio)
- [ ] `MINIO_USE_SSL=false` se estiver na mesma rede Docker
- [ ] Credenciais corretas (`MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`)
- [ ] Serviço MinIO está rodando e acessível

## Erro Comum

❌ **Errado:**
```env
MINIO_ENDPOINT=https://saas-agentes-minio.90qhxz.easypanel.host
MINIO_PORT=9001
MINIO_USE_SSL=true
```

✅ **Correto:**
```env
MINIO_ENDPOINT=saas-agentes-minio
MINIO_PORT=9000
MINIO_USE_SSL=false
```
