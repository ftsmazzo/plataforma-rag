# 📤 Instalação via Base64 (Sem Upload Visual)

## Problema: Não tem upload visual no EasyPanel

Vamos usar base64 para transferir os arquivos via terminal!

## ✅ Método: Usar Base64

### Passo 1: No seu computador (Windows PowerShell)

```powershell
# 1. Ir para a pasta
cd "C:\Users\Frederico Mazzo\rag"

# 2. Compactar APENAS os arquivos necessários (sem node_modules e dist)
# Criar um ZIP limpo
Compress-Archive -Path n8n-node-rag\package.json,n8n-node-rag\tsconfig.json,n8n-node-rag\index.js,n8n-node-rag\credentials,n8n-node-rag\nodes -DestinationPath n8n-node-rag-clean.zip -Force

# 3. Converter para base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\n8n-node-rag-clean.zip")) | Out-File -Encoding ASCII n8n-node-rag-base64.txt

# 4. Copiar o conteúdo do arquivo n8n-node-rag-base64.txt
# (Vai ser um texto muito longo)
```

### Passo 2: No servidor n8n (Terminal)

```bash
cd ~/.n8n/custom

# 1. Criar arquivo temporário com o base64
# Cole o conteúdo do base64.txt aqui (vai ser muito longo, pode colar em partes)
cat > n8n-base64.txt << 'ENDOFBASE64'
[COLE AQUI O CONTEÚDO DO ARQUIVO base64.txt DO SEU COMPUTADOR]
ENDOFBASE64

# 2. Decodificar base64 para ZIP
base64 -d n8n-base64.txt > n8n-node-rag.zip

# 3. Extrair
unzip -q n8n-node-rag.zip -d n8n-node-rag

# 4. Limpar
rm n8n-base64.txt n8n-node-rag.zip

# 5. Instalar e compilar
cd n8n-node-rag
npm install
npm run build

# 6. Verificar
ls dist/
```

## 🔄 Método Alternativo: Criar Arquivos Manualmente

Se o base64 for muito complicado, você pode criar os arquivos principais manualmente:

### 1. Criar estrutura

```bash
cd ~/.n8n/custom
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG
cd n8n-node-rag
```

### 2. Criar package.json

Copie e cole este comando (vai criar o package.json):

```bash
cat > package.json << 'EOF'
{
  "name": "@rag-system/n8n-nodes-rag",
  "version": "1.0.0",
  "description": "n8n community node for RAG Knowledge Base System",
  "keywords": ["n8n-community-node-package", "rag", "knowledge-base", "ai", "semantic-search"],
  "license": "MIT",
  "homepage": "https://github.com/ftsmazzo/sistema-rag",
  "author": {"name": "RAG System", "email": "support@rag-system.com"},
  "repository": {"type": "git", "url": "https://github.com/ftsmazzo/sistema-rag.git", "directory": "n8n-node-rag"},
  "publishConfig": {"access": "public"},
  "scripts": {
    "build": "tsc",
    "postinstall": "if [ ! -d dist ]; then npm run build || true; fi",
    "dev": "tsc --watch"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": ["dist/nodes/RAG/RAG.node.js"],
    "credentials": ["dist/credentials/RAGApi.credentials.js"]
  },
  "devDependencies": {
    "@typescript-eslint/parser": "^5.45.0",
    "eslint-plugin-n8n-nodes-base": "~1.11.0",
    "gulp": "^4.0.2",
    "n8n-workflow": "*",
    "prettier": "^2.7.1",
    "typescript": "~4.8.4"
  },
  "dependencies": {"n8n-workflow": "*"}
}
EOF
```

### 3. Criar tsconfig.json

```bash
cat > tsconfig.json << 'EOF'
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
EOF
```

### 4. Depois, você precisa criar os arquivos .ts manualmente

Os arquivos TypeScript são muito longos. A melhor opção é:
- Usar o método base64 acima
- Ou fazer upload via SCP do seu computador
- Ou criar um repositório temporário e clonar

## 🚀 Método Mais Simples: Usar GitHub Gist

1. No seu computador, crie um Gist no GitHub com os arquivos
2. No servidor, baixe do Gist:

```bash
cd ~/.n8n/custom
git clone https://gist.github.com/SEU-GIST-ID.git n8n-node-rag
cd n8n-node-rag
npm install
npm run build
```
