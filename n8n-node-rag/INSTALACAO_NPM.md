# 📦 Instalação via npm - @fabricaia/n8n-nodes-rag

## ✅ Pacote Publicado!

O pacote está disponível em: https://www.npmjs.com/package/@fabricaia/n8n-nodes-rag

## 🚀 Instalação no n8n

### Método 1: Via Interface do n8n (Recomendado)

1. No n8n, vá em **Settings** → **Community Nodes**
2. Clique em **Install a community node**
3. Digite: `@fabricaia/n8n-nodes-rag`
4. Clique em **Install**
5. Aguarde alguns segundos (pode demorar até 1-2 minutos após publicação)
6. Reinicie o n8n se necessário

### Método 2: Via Terminal (EasyPanel)

```bash
# 1. Ir para a pasta custom do n8n
cd ~/.n8n/custom

# 2. Instalar o pacote
npm install @fabricaia/n8n-nodes-rag

# 3. Verificar se instalou
ls -la node_modules/@fabricaia/n8n-nodes-rag/

# 4. Reiniciar o n8n no EasyPanel
```

## ⚠️ Se Der Erro 404

O pacote pode levar alguns minutos para aparecer no registry. Tente:

1. **Aguardar 2-5 minutos** após a publicação
2. **Limpar cache do npm**:
   ```bash
   npm cache clean --force
   ```
3. **Verificar se o pacote existe**:
   ```bash
   npm view @fabricaia/n8n-nodes-rag
   ```
4. **Instalar diretamente**:
   ```bash
   npm install @fabricaia/n8n-nodes-rag --registry=https://registry.npmjs.org
   ```

## ✅ Verificar Instalação

Depois de instalar, o node "FabricaIa-RAG" deve aparecer na lista de nodes do n8n.

## 🔄 Atualizar Versão

Quando houver atualizações:

```bash
cd ~/.n8n/custom
npm update @fabricaia/n8n-nodes-rag
```

Ou reinstalar:
```bash
npm install @fabricaia/n8n-nodes-rag@latest
```
