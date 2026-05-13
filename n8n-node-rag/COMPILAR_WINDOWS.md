# 🔧 Compilar no Windows

## ✅ Script Corrigido

O script de build foi corrigido para funcionar no Windows.

## 🚀 Como Compilar

```bash
cd n8n-node-rag
npm install
npm run build
```

## ✅ Verificar

Depois de compilar, verifique:

```bash
ls dist/nodes/RAG/
# Deve ter:
# - RAG.node.js
# - RAG.node.d.ts
# - rag.svg
```

## 📦 Próximo Passo: Publicar no npm

Depois de compilar com sucesso:

```bash
npm login  # Se ainda não fez login
npm publish --access public
```

## 🎉 Depois de Publicar

Qualquer um pode instalar com:

```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```
