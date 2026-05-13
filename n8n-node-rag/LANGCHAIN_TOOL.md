# 🔧 Como Fazer o Node Aparecer como Tool no LangChain Agent

## 🎯 Problema

O node não aparece como opção de Tool no LangChain Agent do n8n.

## ✅ Solução Aplicada

Adicionei o grupo `'ai'` ao node para que ele apareça na categoria de AI/Tools do n8n.

## 🚀 Atualizar no Servidor

No terminal do n8n (EasyPanel):

```bash
# 1. Atualizar código
cd ~/.n8n/custom/n8n-node-rag
git pull origin main

# OU baixar ZIP novamente:
cd ~/.n8n/custom
rm -rf n8n-node-rag
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/main.zip -o temp-rag.zip
unzip temp-rag.zip
cp -r sistema-rag-main/n8n-node-rag .
rm -rf sistema-rag-main temp-rag.zip

# 2. Recompilar (IMPORTANTE!)
cd n8n-node-rag
npm install typescript --save-dev
npm run build

# 3. Verificar se compilou
ls -la dist/nodes/RAG/
# Deve ter: RAG.node.js

# 4. Reiniciar o n8n no EasyPanel
```

## 📝 Nota sobre LangChain Agent

O n8n LangChain Agent normalmente mostra nodes que:
- Estão no grupo `'ai'` ou `'transform'`
- Têm inputs/outputs compatíveis
- Retornam dados estruturados

O node já está configurado com:
- ✅ Grupo `['transform', 'ai']`
- ✅ Input/Output `['main']`
- ✅ Retorno estruturado (JSON)

## 🔍 Verificar

1. Reinicie o n8n
2. Crie um workflow com LangChain Agent
3. Configure o Agent
4. Na seção "Tools", procure por **"FabricaIa-RAG"**
5. ✅ Deve aparecer!

## 🐛 Se ainda não aparecer

Alguns nodes do n8n precisam de configuração adicional para aparecerem como Tools. Verifique:
- O node está compilado corretamente?
- O n8n foi reiniciado após a atualização?
- Os arquivos `dist/` estão atualizados?
