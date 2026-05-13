#!/bin/sh
# Script de instalação simples para o n8n node

set -e

echo "🚀 Instalando n8n-node-rag..."

# Criar pasta custom se não existir
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# Remover instalação anterior se existir
if [ -d "n8n-node-rag" ]; then
    echo "📦 Removendo instalação anterior..."
    rm -rf n8n-node-rag
fi

# Clonar repositório
echo "📥 Clonando repositório..."
git clone --depth 1 https://github.com/ftsmazzo/sistema-rag.git temp-rag

# Copiar apenas a pasta n8n-node-rag
echo "📋 Copiando n8n-node-rag..."
cp -r temp-rag/n8n-node-rag .

# Limpar
echo "🧹 Limpando..."
rm -rf temp-rag

# Instalar dependências
echo "📦 Instalando dependências..."
cd n8n-node-rag
npm install --production

echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Reinicie o n8n no EasyPanel"
echo "2. Abra o n8n e crie um workflow"
echo "3. Procure por 'RAG Knowledge Base'"
echo "4. ✅ Deve aparecer!"
