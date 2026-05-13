# ✅ Comando Direto - Mais Simples

## 🎯 Solução Imediata

No terminal do n8n, execute:

```bash
# Você já está em ~/n8n-node-rag

# 1. Instalar TypeScript (se ainda não instalou)
npm install typescript --save-dev

# 2. Compilar usando o binário diretamente
./node_modules/.bin/tsc

# OU se não funcionar:
node_modules/.bin/tsc

# 3. Verificar
ls dist/
```

## 🔄 Se o caminho não funcionar

```bash
# Usar npx com typescript explicitamente
npx -y typescript tsc

# OU instalar globalmente (dentro do container)
npm install -g typescript
tsc
```

## ✅ Comando Mais Simples

```bash
# Tudo em um comando:
npm install typescript --save-dev && node_modules/.bin/tsc && ls dist/
```

## Depois de compilar

1. Reinicie o n8n no EasyPanel
2. Abra o n8n e procure por "RAG Knowledge Base"
3. ✅ Deve aparecer!
