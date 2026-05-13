#!/bin/sh
# Script para criar a estrutura do node manualmente

cd ~/.n8n/custom

# Criar estrutura de pastas
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG

# Se você tem o temp-rag clonado, copiar arquivos
if [ -d "temp-rag" ]; then
    # Copiar arquivos do repositório (se existirem)
    cp temp-rag/n8n-node-rag/*.json n8n-node-rag/ 2>/dev/null || true
    cp temp-rag/n8n-node-rag/*.ts n8n-node-rag/ 2>/dev/null || true
    cp temp-rag/n8n-node-rag/credentials/* n8n-node-rag/credentials/ 2>/dev/null || true
    cp temp-rag/n8n-node-rag/nodes/RAG/* n8n-node-rag/nodes/RAG/ 2>/dev/null || true
fi

echo "Estrutura criada. Agora você precisa fazer upload dos arquivos ou usar git sparse-checkout."
