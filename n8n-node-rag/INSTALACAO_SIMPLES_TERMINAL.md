# ✅ Instalação Simples - Passo a Passo

## 🎯 Solução Direta

O `git sparse-checkout` pode não funcionar em todos os ambientes. Use esta solução mais simples:

### No Terminal do n8n (EasyPanel):

```bash
# 1. Ir para a pasta custom
cd ~/.n8n/custom

# 2. Clonar o repositório completo (é pequeno, não tem problema)
git clone https://github.com/ftsmazzo/sistema-rag.git temp-rag

# 3. Copiar apenas a pasta n8n-node-rag
cp -r temp-rag/n8n-node-rag .

# 4. Limpar
rm -rf temp-rag

# 5. Instalar (SEM COMPILAR - já vem compilado!)
cd n8n-node-rag
npm install --production

# 6. Reiniciar o n8n no EasyPanel
```

## 🔄 Alternativa: Se o clone completo for muito lento

```bash
# 1. Ir para a pasta custom
cd ~/.n8n/custom

# 2. Criar pasta
mkdir n8n-node-rag
cd n8n-node-rag

# 3. Baixar apenas os arquivos necessários via curl/wget
# (Vou criar um script para isso)
```

## ✅ Depois

1. Reinicie o n8n no EasyPanel
2. Abra o n8n
3. Crie um workflow
4. Procure por "RAG Knowledge Base"
5. ✅ Deve aparecer!
