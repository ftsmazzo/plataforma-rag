# 📦 Como Publicar no npm - Guia Completo

## 🎯 Por Que Publicar?

Depois de publicar, qualquer um pode instalar com:
```bash
npm install @rag-system/n8n-nodes-rag
```

**Sem precisar:**
- ❌ Clonar repositório
- ❌ Compilar código
- ❌ Copiar arquivos manualmente
- ❌ Configurar nada

## ✅ Passo a Passo

### 1. Criar Conta no npm

1. Acesse: https://www.npmjs.com/signup
2. Crie uma conta
3. Verifique seu email

### 2. No Seu Computador

```bash
# 1. Ir para a pasta do node
cd n8n-node-rag

# 2. Instalar dependências
npm install

# 3. Compilar
npm run build

# 4. Verificar
ls -la dist/nodes/RAG/
# Deve ter: RAG.node.js, RAG.node.d.ts, rag.svg
```

### 3. Fazer Login

```bash
npm login
# Digite seu username, password e email
```

### 4. Publicar

```bash
npm publish --access public
```

## 🎉 Pronto!

Agora qualquer um pode instalar com:
```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```

## 🔄 Atualizar Versão

Quando fizer mudanças:

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm run build
npm publish --access public
```
