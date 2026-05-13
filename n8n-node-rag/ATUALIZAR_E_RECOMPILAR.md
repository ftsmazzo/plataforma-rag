# 🔄 Atualizar e Recompilar o Node - Passo a Passo

## 🎯 Problema

O nome "FabricaIa-RAG" e o ícone não aparecem porque os arquivos compilados não foram atualizados.

## ✅ Solução Completa

### No Terminal do n8n (EasyPanel):

```bash
# 1. Ir para a pasta custom
cd ~/.n8n/custom

# 2. Remover instalação antiga
rm -rf n8n-node-rag

# 3. Baixar versão atualizada
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/main.zip -o temp-rag.zip
unzip temp-rag.zip
cp -r sistema-rag-main/n8n-node-rag .
rm -rf sistema-rag-main temp-rag.zip

# 4. Instalar dependências
cd n8n-node-rag
npm install

# 5. Instalar TypeScript (se necessário)
npm install typescript --save-dev

# 6. Recompilar
npm run build

# OU se npm run build não funcionar:
npx tsc

# OU se npx não funcionar:
./node_modules/.bin/tsc

# 7. Verificar se compilou
ls -la dist/nodes/RAG/
# Deve mostrar: RAG.node.js e RAG.node.d.ts

# 8. Reiniciar o n8n no EasyPanel
```

## ✅ Depois de Recompilar

1. **Reinicie o n8n** no EasyPanel
2. **Crie um novo workflow**
3. **Procure por "FabricaIa-RAG"**
4. ✅ **Deve aparecer com o nome correto e ícone!**

## 🔧 Para LangChain Agent

O node agora está no grupo `['transform', 'ai']` para aparecer como Tool:

1. Crie um workflow com **LangChain Agent**
2. Configure o Agent
3. Na seção **"Tools"**, procure por **"FabricaIa-RAG"**
4. ✅ **Deve aparecer como opção!**

## 🐛 Se ainda não funcionar

Verifique:
- Os arquivos `dist/` foram criados? (`ls -la dist/nodes/RAG/`)
- O n8n foi reiniciado?
- Há erros nos logs do n8n?
