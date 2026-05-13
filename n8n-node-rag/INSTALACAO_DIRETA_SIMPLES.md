# ✅ Instalação Direta - Solução Mais Simples

## 🎯 Problema

A pasta `n8n-node-rag` pode não estar aparecendo no clone. Vamos usar uma solução alternativa mais direta.

## 🚀 Solução: Baixar ZIP do GitHub

### No Terminal do n8n:

```bash
# 1. Ir para custom
cd ~/.n8n/custom

# 2. Baixar o ZIP do GitHub diretamente
wget https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/master.zip -O temp-rag.zip

# OU se não tiver wget, use curl:
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/master.zip -o temp-rag.zip

# 3. Extrair
unzip temp-rag.zip

# 4. Copiar a pasta
cp -r sistema-rag-master/n8n-node-rag .

# 5. Limpar
rm -rf sistema-rag-master temp-rag.zip

# 6. Instalar
cd n8n-node-rag
npm install --production

# 7. Reiniciar o n8n no EasyPanel
```

## 🔄 Alternativa: Criar a pasta manualmente

Se o ZIP não funcionar, podemos criar os arquivos diretamente. Mas primeiro, vamos verificar se a pasta existe no repositório:

```bash
# Verificar se existe
curl -s https://api.github.com/repos/ftsmazzo/sistema-rag/contents/n8n-node-rag | head -20
```

## ✅ Depois

1. Reinicie o n8n no EasyPanel
2. Abra o n8n
3. Crie um workflow
4. Procure por "RAG Knowledge Base"
5. ✅ Deve aparecer!
