# ✅ Instalação Usando Git Sparse-Checkout

## Problema: A pasta n8n-node-rag não aparece no clone normal

Isso acontece porque pode estar em uma branch diferente ou não foi commitada ainda.

## ✅ Solução: Usar Git Sparse-Checkout

Execute no terminal do n8n:

```bash
# 1. Ir para a pasta custom
cd ~/.n8n/custom

# 2. Limpar se tiver algo
rm -rf temp-rag n8n-node-rag

# 3. Clonar com sparse-checkout
git clone --filter=blob:none --sparse https://github.com/ftsmazzo/sistema-rag.git temp-rag

# 4. Entrar no repositório
cd temp-rag

# 5. Configurar sparse-checkout para pegar apenas n8n-node-rag
git sparse-checkout init --cone
git sparse-checkout set n8n-node-rag

# 6. Verificar se apareceu
ls -la n8n-node-rag/

# 7. Se apareceu, copiar
cd ..
cp -r temp-rag/n8n-node-rag ./
rm -rf temp-rag

# 8. Entrar na pasta
cd n8n-node-rag

# 9. Instalar e compilar
npm install
npm run build

# 10. Verificar
ls dist/
```

## 🔄 Alternativa: Verificar Branch

Se sparse-checkout não funcionar, pode ser que a pasta esteja em outra branch:

```bash
cd temp-rag
git branch -a
git checkout main  # ou outra branch
ls -la n8n-node-rag/
```

## 📦 Alternativa Final: Upload Manual

Se nada funcionar, você pode:

1. No seu computador local, compactar a pasta `n8n-node-rag`
2. Fazer upload para o servidor
3. Extrair e compilar

```bash
# No servidor, após upload
cd ~/.n8n/custom
unzip n8n-node-rag.zip  # ou tar -xzf n8n-node-rag.tar.gz
cd n8n-node-rag
npm install
npm run build
```
