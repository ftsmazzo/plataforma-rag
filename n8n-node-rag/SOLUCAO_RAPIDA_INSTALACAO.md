# ⚡ Solução Rápida - Instalação Manual

## Problema: A pasta n8n-node-rag não está no repositório clonado

## ✅ Solução: Verificar o que foi clonado e criar manualmente

Execute no terminal do n8n:

```bash
# 1. Ver o que tem no temp-rag
ls -la temp-rag/

# 2. Verificar se existe a pasta
find temp-rag -name "n8n-node-rag" -type d

# 3. Se não existir, vamos criar manualmente
cd ~/.n8n/custom

# 4. Criar estrutura de pastas
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG

# 5. Baixar arquivos diretamente do GitHub (usando curl ou wget)
# Ou você pode copiar manualmente do seu computador

# 6. Depois de ter os arquivos, instalar
cd n8n-node-rag
npm install
npm run build
```

## 🔄 Alternativa: Usar git sparse-checkout

```bash
cd ~/.n8n/custom
rm -rf temp-rag

# Clonar com sparse-checkout para pegar apenas a pasta n8n-node-rag
git clone --filter=blob:none --sparse https://github.com/ftsmazzo/sistema-rag.git temp-rag
cd temp-rag
git sparse-checkout init --cone
git sparse-checkout set n8n-node-rag
cd ..

# Agora copiar
cp -r temp-rag/n8n-node-rag ./
rm -rf temp-rag
cd n8n-node-rag
npm install
npm run build
```

## 📦 Alternativa Mais Simples: Fazer Upload Manual

Se você tem acesso ao seu computador local:

1. No seu computador, vá para a pasta `n8n-node-rag`
2. Compacte a pasta: `zip -r n8n-node-rag.zip n8n-node-rag/`
3. Faça upload do ZIP para o servidor n8n
4. No servidor:
```bash
cd ~/.n8n/custom
unzip n8n-node-rag.zip
cd n8n-node-rag
npm install
npm run build
```
