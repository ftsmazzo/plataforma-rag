# 🚀 Instalação no EasyPanel (n8n)

## 📍 Localização do n8n no EasyPanel

O n8n no EasyPanel geralmente usa:
- **Pasta de dados**: `/home/node/.n8n` ou `/app/.n8n`
- **Pasta custom**: `/home/node/.n8n/custom` ou `/app/.n8n/custom`

## ✅ Passo a Passo

### 1. Verificar onde está a pasta .n8n

```bash
# Verificar home do usuário
echo $HOME

# Verificar se existe .n8n
ls -la ~/.n8n/

# Ou verificar em /app
ls -la /app/.n8n/ 2>/dev/null

# Verificar variáveis de ambiente do n8n
env | grep -i n8n
```

### 2. Criar pasta custom

```bash
# Criar pasta custom (ajuste conforme necessário)
mkdir -p ~/.n8n/custom

# OU se estiver em /app
mkdir -p /app/.n8n/custom
```

### 3. Instalar o node

```bash
# Ir para a pasta custom
cd ~/.n8n/custom
# OU
cd /app/.n8n/custom

# Clonar o repositório
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

# Verificar
ls dist/
# Deve mostrar:
# - nodes/RAG/RAG.node.js
# - credentials/RAGApi.credentials.js
```

### 4. Reiniciar o n8n

No EasyPanel:
1. Vá para o serviço n8n
2. Clique em **Restart** ou **Reiniciar**

### 5. Verificar

1. Abra o n8n no navegador
2. Crie um workflow
3. Procure por **"RAG Knowledge Base"**
4. ✅ Deve aparecer!

## 🐛 Se não encontrar a pasta

Execute este comando para descobrir:

```bash
# Verificar onde o n8n está salvando dados
ps aux | grep n8n | grep -o '\-\-user-folder[= ][^ ]*' || echo "Usando padrão: ~/.n8n"

# Verificar arquivos abertos pelo processo n8n
lsof -p $(pgrep -f "n8n" | head -1) 2>/dev/null | grep -i n8n | head -5
```

## 📝 Nota sobre EasyPanel

No EasyPanel, a pasta pode estar em:
- `/home/node/.n8n` (usuário node)
- `/app/.n8n` (se montado como volume)
- `/data/.n8n` (se configurado assim)

Verifique qual é o caso do seu setup.
