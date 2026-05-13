# 🔧 Como Recompilar o Node do n8n

## 🎯 Problema

O nome "FabricaIa-RAG" e o novo ícone não aparecem porque os arquivos compilados não foram atualizados.

## 🚀 Solução: Recompilar no Servidor

No terminal do n8n (EasyPanel):

```bash
# 1. Ir para a pasta do node
cd ~/.n8n/custom/n8n-node-rag

# 2. Baixar atualizações
cd ~/.n8n/custom
rm -rf n8n-node-rag
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/master.zip -o temp-rag.zip
unzip temp-rag.zip
cp -r sistema-rag-master/n8n-node-rag .
rm -rf sistema-rag-master temp-rag.zip

# 3. Instalar TypeScript (se necessário)
cd n8n-node-rag
npm install typescript --save-dev

# 4. Recompilar
npx tsc

# OU se não funcionar:
node_modules/.bin/tsc

# 5. Verificar se compilou
ls -la dist/nodes/RAG/
# Deve ter: RAG.node.js e RAG.node.d.ts

# 6. Reiniciar o n8n no EasyPanel
```

## ✅ Depois

1. Reinicie o n8n
2. Crie um novo workflow
3. Procure por **"FabricaIa-RAG"**
4. ✅ Deve aparecer com o novo nome e ícone!

## 🐛 Correção do Bug isActive

A correção já foi aplicada no código:
- A API agora retorna `isActive` corretamente (aceita tanto `true` quanto `1`)
- O node do n8n filtra corretamente as bases ativas

Após recompilar e reiniciar, as bases ativas devem aparecer corretamente!
