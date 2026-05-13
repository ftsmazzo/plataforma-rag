#!/bin/sh
# Script para criar todos os arquivos do node diretamente no terminal
# Execute este script no terminal do n8n

cd ~/.n8n/custom

# Criar estrutura de pastas
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG

cd n8n-node-rag

# Criar package.json
cat > package.json << 'ENDOFFILE'
{
  "name": "@rag-system/n8n-nodes-rag",
  "version": "1.0.0",
  "description": "n8n community node for RAG Knowledge Base System",
  "keywords": [
    "n8n-community-node-package",
    "rag",
    "knowledge-base",
    "ai",
    "semantic-search"
  ],
  "license": "MIT",
  "homepage": "https://github.com/ftsmazzo/sistema-rag",
  "author": {
    "name": "RAG System",
    "email": "support@rag-system.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ftsmazzo/sistema-rag.git",
    "directory": "n8n-node-rag"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc",
    "postinstall": "if [ ! -d dist ]; then npm run build || true; fi",
    "dev": "tsc --watch",
    "format": "prettier nodes credentials --write",
    "lint": "eslint nodes credentials package.json",
    "prepublishOnly": "npm run build && npm run lint -s"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": [
      "dist/nodes/RAG/RAG.node.js"
    ],
    "credentials": [
      "dist/credentials/RAGApi.credentials.js"
    ]
  },
  "devDependencies": {
    "@typescript-eslint/parser": "^5.45.0",
    "eslint-plugin-n8n-nodes-base": "~1.11.0",
    "gulp": "^4.0.2",
    "n8n-workflow": "*",
    "prettier": "^2.7.1",
    "typescript": "~4.8.4"
  },
  "dependencies": {
    "n8n-workflow": "*"
  }
}
ENDOFFILE

# Criar tsconfig.json
cat > tsconfig.json << 'ENDOFFILE'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "noEmitOnError": false
  },
  "include": ["nodes/**/*", "credentials/**/*"],
  "exclude": ["node_modules/**/*", "dist/**/*"]
}
ENDOFFILE

# Criar index.js
cat > index.js << 'ENDOFFILE'
// Entry point for n8n custom node package
module.exports = {};
ENDOFFILE

echo "✅ Arquivos criados! Agora execute: npm install && npm run build"
