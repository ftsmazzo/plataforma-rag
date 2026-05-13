# 🔧 Solução: Pasta dist não encontrada

## Problema

Após instalar o node via GitHub, a pasta `dist` não existe porque o npm não compila automaticamente.

## ✅ Solução Rápida

### Opção 1: Reinstalar (Recomendado)

O pacote agora tem um script `postinstall` que compila automaticamente. Reinstale:

```bash
# Remover instalação anterior
npm uninstall @rag-system/n8n-nodes-rag

# Reinstalar (agora vai compilar automaticamente)
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag

# Reiniciar n8n
```

### Opção 2: Compilar Manualmente

Se preferir não reinstalar:

```bash
# Encontrar onde o pacote foi instalado
find . -name "@rag-system" -type d 2>/dev/null

# Ou verificar em node_modules
ls -la node_modules/ | grep rag

# Entrar na pasta do pacote
cd node_modules/@rag-system/n8n-nodes-rag

# Instalar dependências (se necessário)
npm install

# Compilar
npm run build

# Voltar para a raiz
cd ../../..
```

### Opção 3: Verificar Estrutura

```bash
# Verificar se o pacote foi instalado
npm list @rag-system/n8n-nodes-rag

# Ver estrutura do pacote
ls -la node_modules/@rag-system/n8n-nodes-rag/
```

## ✅ Após Compilar

1. **Verificar se dist foi criada:**
```bash
ls node_modules/@rag-system/n8n-nodes-rag/dist
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

2. **Reiniciar o n8n:**
- Docker: `docker restart <container>`
- EasyPanel: Reinicie o serviço
- Manual: Reinicie o processo

3. **Verificar no n8n:**
- Abra o n8n
- Crie um workflow
- Procure por "RAG Knowledge Base"
- ✅ Deve aparecer!

## 🐛 Se ainda não funcionar

1. Verifique os logs do n8n para erros
2. Certifique-se de que TypeScript está instalado:
```bash
npm install -g typescript
```
3. Tente compilar manualmente com mais verbosidade:
```bash
cd node_modules/@rag-system/n8n-nodes-rag
npx tsc --version
npm run build
```
