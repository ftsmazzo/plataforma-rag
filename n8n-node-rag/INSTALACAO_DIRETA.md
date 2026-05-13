# 🚀 Instalação Direta - Criar Arquivos Manualmente

## Problema: A pasta não aparece no Git

Vamos criar os arquivos diretamente no servidor.

## ✅ Solução: Criar Estrutura e Arquivos

Execute no terminal do n8n:

```bash
cd ~/.n8n/custom

# Criar estrutura
mkdir -p n8n-node-rag/credentials
mkdir -p n8n-node-rag/nodes/RAG

# Agora você precisa criar os arquivos manualmente
# Ou fazer upload do ZIP da pasta n8n-node-rag do seu computador
```

## 📦 Opção Mais Rápida: Upload Manual

### No seu computador (Windows):

1. Vá para a pasta `C:\Users\Frederico Mazzo\rag\n8n-node-rag`
2. Selecione todos os arquivos (exceto `node_modules` e `dist` se existir)
3. Compacte em ZIP: `n8n-node-rag.zip`
4. Faça upload para o servidor n8n via EasyPanel ou SCP

### No servidor n8n:

```bash
cd ~/.n8n/custom

# Se você fez upload do ZIP
unzip n8n-node-rag.zip

# OU se você fez upload da pasta diretamente
# (ajuste o caminho conforme necessário)

# Entrar na pasta
cd n8n-node-rag

# Instalar dependências
npm install

# Compilar
npm run build

# Verificar
ls dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

## 🔄 Alternativa: Usar SCP do seu computador

Se você tem acesso SSH do seu computador para o servidor:

```bash
# No seu computador (PowerShell ou CMD)
scp -r "C:\Users\Frederico Mazzo\rag\n8n-node-rag" usuario@servidor:/home/node/.n8n/custom/

# Depois no servidor
cd ~/.n8n/custom/n8n-node-rag
npm install
npm run build
```

## 📝 Arquivos Essenciais Necessários

Você precisa ter estes arquivos na pasta `n8n-node-rag`:

- `package.json`
- `tsconfig.json`
- `credentials/RAGApi.credentials.ts`
- `nodes/RAG/RAG.node.ts`
- `nodes/RAG/rag.svg`
- `.gitignore`
- `.npmignore`

Todos esses arquivos já existem no seu computador em `C:\Users\Frederico Mazzo\rag\n8n-node-rag\`
