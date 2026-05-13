# ✅ Instalação Corrigida - Passo a Passo

## Problema: A pasta n8n-node-rag não foi encontrada

Isso pode acontecer se a branch estiver errada ou se a pasta não estiver no repositório.

## ✅ Solução: Verificar e Instalar Corretamente

### Passo 1: Verificar o que foi clonado

```bash
# Ver o que tem no temp-rag
ls -la temp-rag/

# Verificar se existe a pasta n8n-node-rag
ls -la temp-rag/n8n-node-rag/ 2>/dev/null || echo "Pasta não encontrada"

# Verificar branches disponíveis
cd temp-rag
git branch -a
cd ..
```

### Passo 2: Se a pasta não existir, criar manualmente

```bash
# Criar a estrutura manualmente
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG

# Copiar arquivos do repositório
cp temp-rag/n8n-node-rag/*.json n8n-node-rag/ 2>/dev/null
cp temp-rag/n8n-node-rag/*.ts n8n-node-rag/ 2>/dev/null
cp temp-rag/n8n-node-rag/credentials/* n8n-node-rag/credentials/ 2>/dev/null
cp temp-rag/n8n-node-rag/nodes/RAG/* n8n-node-rag/nodes/RAG/ 2>/dev/null
```

### Passo 3: Alternativa - Baixar direto do GitHub

```bash
# Remover temp-rag
rm -rf temp-rag

# Baixar apenas a pasta n8n-node-rag usando git sparse-checkout
git clone --filter=blob:none --sparse https://github.com/ftsmazzo/sistema-rag.git temp-rag
cd temp-rag
git sparse-checkout set n8n-node-rag
cd ..

# Agora copiar
cp -r temp-rag/n8n-node-rag ./
rm -rf temp-rag
```

### Passo 4: Ou criar do zero (mais simples)

Se nada funcionar, podemos criar a estrutura básica e você pode fazer upload dos arquivos manualmente.
