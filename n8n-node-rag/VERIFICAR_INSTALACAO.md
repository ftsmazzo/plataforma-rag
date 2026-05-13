# ✅ Verificar Instalação do Node RAG

## 1. Verificar se o pacote foi instalado

```bash
# Verificar se o pacote está instalado
npm list | grep rag

# Ou verificar diretamente
ls node_modules/@rag-system/n8n-nodes-rag
```

## 2. Verificar se está compilado

```bash
# Verificar se a pasta dist existe
ls node_modules/@rag-system/n8n-nodes-rag/dist

# Deve ter:
# - dist/nodes/RAG/RAG.node.js
# - dist/credentials/RAGApi.credentials.js
```

## 3. Se NÃO tiver a pasta dist, compilar:

```bash
cd node_modules/@rag-system/n8n-nodes-rag
npm install
npm run build
cd ../../..
```

## 4. Reiniciar o n8n

**IMPORTANTE**: Sempre reinicie o n8n após instalar um node customizado!

- **Docker**: `docker restart <nome-container>`
- **EasyPanel**: Reinicie o serviço
- **Manual**: Reinicie o processo Node.js

## 5. Verificar no n8n

1. Abra o n8n no navegador
2. Crie um novo workflow
3. Clique em **+** para adicionar node
4. Procure por **"RAG"** ou **"RAG Knowledge Base"**
5. ✅ Se aparecer, está funcionando!

## 🐛 Se não aparecer

1. Verifique os logs do n8n para erros
2. Certifique-se de que reiniciou o n8n
3. Tente compilar manualmente (passo 3 acima)
