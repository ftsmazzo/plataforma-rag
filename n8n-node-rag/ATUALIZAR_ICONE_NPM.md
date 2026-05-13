# 🔧 Atualizar Ícone no Pacote npm

## ✅ Correção Aplicada

O caminho do ícone foi corrigido de `file:nodes/RAG/rag.svg` para `file:rag.svg` para funcionar corretamente quando instalado via npm.

## 🚀 Publicar Nova Versão

No seu computador:

```bash
cd n8n-node-rag
npm run build
npm publish --access public
```

Isso publicará a versão 1.0.1 com o ícone corrigido.

## 📦 Atualizar Instalação

Depois de publicar, no servidor n8n:

```bash
cd ~/.n8n/custom
npm update @fabricaia/n8n-nodes-rag
# OU
npm install @fabricaia/n8n-nodes-rag@latest
```

Depois, **reinicie o n8n**.

## ✅ Verificar

O ícone deve aparecer corretamente após a atualização!
