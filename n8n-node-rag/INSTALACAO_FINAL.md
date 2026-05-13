# ✅ Instalação Final - Passo a Passo Simplificado

## Você já está na pasta correta! Só falta instalar TypeScript e compilar.

Execute estes comandos na ordem:

```bash
# 1. Instalar TypeScript (necessário para compilar)
npm install typescript --save-dev

# 2. Compilar o código
npm run build

# 3. Verificar se compilou
ls dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

## ✅ Depois de compilar

1. **Reiniciar o n8n** no EasyPanel
2. **Abrir o n8n** no navegador
3. **Criar um workflow**
4. **Procurar por "RAG Knowledge Base"**
5. ✅ **Deve aparecer!**

## 🐛 Se ainda der erro

Se o `npm run build` ainda der erro, tente:

```bash
# Instalar TypeScript globalmente
npm install -g typescript

# Ou usar npx
npx tsc
```
