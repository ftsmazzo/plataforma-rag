# 🔧 Instalação Manual do Node RAG

## Problema: npm install não está funcionando corretamente

Se o `npm install` não está criando a pasta `dist`, siga estes passos:

## ✅ Solução: Instalação Manual Passo a Passo

### 1. Encontrar onde o n8n está instalado

```bash
# Verificar onde está o n8n
which n8n
# Ou
echo $N8N_USER_FOLDER
# Ou verificar em:
ls -la ~/.n8n/
```

### 2. Criar pasta custom (se não existir)

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
```

### 3. Clonar ou baixar o repositório

```bash
# Opção A: Clonar o repositório
git clone https://github.com/ftsmazzo/sistema-rag.git temp-rag
mv temp-rag/n8n-node-rag ./n8n-node-rag
rm -rf temp-rag

# Opção B: Baixar ZIP e extrair
# (baixe manualmente do GitHub e extraia a pasta n8n-node-rag)
```

### 4. Instalar dependências e compilar

```bash
cd ~/.n8n/custom/n8n-node-rag
npm install
npm run build
```

### 5. Verificar se compilou

```bash
ls -la dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

### 6. Reiniciar o n8n

- **Docker**: `docker restart <container>`
- **EasyPanel**: Reinicie o serviço
- **Manual**: Reinicie o processo

### 7. Verificar no n8n

1. Abra o n8n
2. Crie um workflow
3. Procure por "RAG Knowledge Base"
4. ✅ Deve aparecer!

## 🔄 Alternativa: Usar link simbólico

Se você já tem o código localmente:

```bash
# No seu computador local
cd /caminho/para/rag/n8n-node-rag
npm install
npm run build

# No servidor n8n, criar link
cd ~/.n8n/custom
ln -s /caminho/completo/para/rag/n8n-node-rag ./n8n-node-rag
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'typescript'"

```bash
npm install -g typescript
# Ou localmente
npm install typescript --save-dev
```

### Erro: "Command 'tsc' not found"

```bash
npx tsc --version
npm run build
```

### Node não aparece após instalação

1. Verifique se está na pasta correta: `~/.n8n/custom/n8n-node-rag`
2. Verifique se compilou: `ls dist/`
3. Verifique logs do n8n
4. Certifique-se de ter reiniciado o n8n
