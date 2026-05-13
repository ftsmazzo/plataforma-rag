# ✅ Instalação Corrigida - SEM sparse-checkout

## 🎯 Problema

O `git sparse-checkout` não está funcionando no ambiente do n8n. Vamos clonar o repositório completo (é pequeno) e copiar apenas o que precisamos.

## 🚀 Solução Simples

No terminal do n8n, execute:

```bash
# 1. Voltar para custom
cd ~/.n8n/custom

# 2. Remover temp-rag se existir
rm -rf temp-rag

# 3. Clonar repositório completo (sem sparse-checkout)
git clone --depth 1 https://github.com/ftsmazzo/sistema-rag.git temp-rag

# 4. Verificar se a pasta existe
ls -la temp-rag/ | grep n8n

# 5. Copiar apenas a pasta n8n-node-rag
cp -r temp-rag/n8n-node-rag .

# 6. Limpar
rm -rf temp-rag

# 7. Instalar
cd n8n-node-rag
npm install --production

# 8. Reiniciar o n8n no EasyPanel
```

## ✅ Verificar

1. Reinicie o n8n no EasyPanel
2. Abra o n8n
3. Crie um workflow
4. Procure por "RAG Knowledge Base"
5. ✅ Deve aparecer!
