# ✅ Instalação Definitiva - Passo a Passo

## 🔍 Passo 1: Encontrar onde o n8n está instalado

Execute estes comandos para descobrir:

```bash
# Verificar variável de ambiente
echo $N8N_USER_FOLDER

# Verificar onde está o n8n
which n8n

# Verificar pasta home do usuário
echo $HOME

# Listar pastas ocultas
ls -la ~ | grep n8n

# Verificar se existe .n8n
ls -la ~/.n8n/ 2>/dev/null || echo "Pasta .n8n não existe"
```

## 📁 Passo 2: Criar pasta custom

```bash
# Criar pasta custom (ajuste o caminho conforme necessário)
mkdir -p ~/.n8n/custom

# Ou se o n8n está em outro lugar:
# mkdir -p /path/to/n8n/custom
```

## 📥 Passo 3: Baixar e compilar o código

```bash
# Ir para a pasta custom
cd ~/.n8n/custom

# Clonar o repositório temporariamente
git clone https://github.com/ftsmazzo/sistema-rag.git temp-rag

# Copiar a pasta n8n-node-rag
cp -r temp-rag/n8n-node-rag ./

# Limpar
rm -rf temp-rag

# Entrar na pasta
cd n8n-node-rag

# Instalar dependências
npm install

# Compilar
npm run build

# Verificar se compilou
ls -la dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

## 🔄 Passo 4: Reiniciar o n8n

```bash
# Docker
docker restart <nome-container>

# EasyPanel
# Reinicie o serviço pelo painel

# Manual
# Reinicie o processo Node.js
```

## ✅ Passo 5: Verificar

1. Abra o n8n no navegador
2. Crie um novo workflow
3. Clique em **+** para adicionar node
4. Procure por **"RAG Knowledge Base"**
5. ✅ Deve aparecer!

## 🐛 Se não encontrar a pasta .n8n

O n8n pode estar usando outra localização. Tente:

```bash
# Verificar processos do n8n
ps aux | grep n8n

# Verificar variáveis de ambiente
env | grep N8N

# Verificar se está em /opt ou /usr/local
ls -la /opt/n8n/ 2>/dev/null
ls -la /usr/local/n8n/ 2>/dev/null
```

## 📝 Alternativa: Instalar em qualquer lugar

Se não conseguir encontrar a pasta custom, você pode instalar em qualquer lugar e criar um link simbólico:

```bash
# Criar pasta em qualquer lugar
mkdir -p /tmp/n8n-rag-node
cd /tmp/n8n-rag-node

# Clonar e compilar (mesmos passos acima)
git clone https://github.com/ftsmazzo/sistema-rag.git temp-rag
cp -r temp-rag/n8n-node-rag ./
rm -rf temp-rag
cd n8n-node-rag
npm install
npm run build

# Depois criar link simbólico quando descobrir onde está o n8n
# ln -s /tmp/n8n-rag-node/n8n-node-rag ~/.n8n/custom/n8n-node-rag
```
