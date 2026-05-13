# ✅ Instalação Super Simples - SEM COMPILAR!

## 🎯 Solução Definitiva

Agora os arquivos já vêm compilados! Você **NÃO precisa compilar** no servidor.

### No Terminal do n8n (EasyPanel):

```bash
# 1. Ir para a pasta custom (se não existir, criar)
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# 2. Clonar APENAS a pasta n8n-node-rag
git clone --depth 1 --filter=blob:none --sparse https://github.com/ftsmazzo/sistema-rag.git temp-rag
cd temp-rag
git sparse-checkout set n8n-node-rag
cd ..

# 3. Mover para o lugar certo
mv temp-rag/n8n-node-rag .
rm -rf temp-rag

# 4. Instalar (SEM COMPILAR - já vem compilado!)
cd n8n-node-rag
npm install --production

# 5. Reiniciar o n8n no EasyPanel
```

## 🚀 OU: Instalar via npm (MAIS FÁCIL!)

Depois de publicar no npm, será só:

```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```

## ✅ Verificar

1. Reinicie o n8n no EasyPanel
2. Abra o n8n
3. Crie um workflow
4. Procure por "RAG Knowledge Base"
5. ✅ Deve aparecer!

## 📦 Publicar no npm (Para facilitar ainda mais)

```bash
cd n8n-node-rag
npm login
npm publish --access public
```

Depois disso, qualquer um pode instalar com:
```bash
npm install @rag-system/n8n-nodes-rag
```
