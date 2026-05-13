# 🔧 Solução: tsc: not found

## Problema

O TypeScript está instalado, mas o comando `tsc` não é encontrado.

## ✅ Solução Rápida

Execute no terminal do n8n:

```bash
# Você já está em ~/n8n-node-rag

# 1. Instalar TypeScript e dependências
npm install

# 2. Compilar usando npx (não precisa de tsc no PATH)
npx tsc

# 3. Verificar
ls dist/
```

## 🔄 Alternativa: Atualizar package.json

Se quiser que `npm run build` funcione, atualize o package.json:

```bash
# Editar package.json para usar npx
sed -i 's/"build": "tsc"/"build": "npx tsc"/' package.json

# Depois compilar
npm run build
```

## ✅ Comandos Finais (Simplificado)

```bash
# Você já está em ~/n8n-node-rag, então só execute:

# 1. Instalar tudo
npm install

# 2. Compilar com npx
npx tsc

# 3. Verificar
ls dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

## Depois

1. Reinicie o n8n no EasyPanel
2. Abra o n8n e procure por "RAG Knowledge Base"
3. ✅ Deve aparecer!
