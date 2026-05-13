# ✅ SOLUÇÃO SIMPLES - Leia Primeiro!

## 🎯 Agora os arquivos JÁ VÊM COMPILADOS!

Você **NÃO precisa compilar** no servidor. Os arquivos `.js` já estão no repositório!

## 🚀 Instalação no n8n (EasyPanel)

### Opção 1: Script Automático (MAIS FÁCIL!)

```bash
# No terminal do n8n, execute:
cd ~/.n8n/custom
curl -sSL https://raw.githubusercontent.com/ftsmazzo/sistema-rag/master/n8n-node-rag/INSTALAR.sh | sh
```

### Opção 2: Manual (Passo a Passo)

```bash
# 1. Criar pasta custom
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# 2. Clonar repositório (completo, mas é pequeno)
git clone --depth 1 https://github.com/ftsmazzo/sistema-rag.git temp-rag

# 3. Copiar apenas a pasta n8n-node-rag
cp -r temp-rag/n8n-node-rag .

# 4. Limpar
rm -rf temp-rag

# 5. Instalar (SEM COMPILAR - já vem compilado!)
cd n8n-node-rag
npm install --production

# 6. Reiniciar o n8n no EasyPanel
```

## ✅ Depois

1. Reinicie o n8n no EasyPanel
2. Abra o n8n
3. Crie um workflow
4. Procure por "RAG Knowledge Base"
5. ✅ Deve aparecer!

## 📦 Ou: Publicar no npm (Mais Fácil)

No seu computador local:

```bash
cd n8n-node-rag
npm login
npm publish --access public
```

Depois, no servidor:
```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```

## 🎉 Pronto!

Não precisa mais compilar! Os arquivos já vêm prontos!
