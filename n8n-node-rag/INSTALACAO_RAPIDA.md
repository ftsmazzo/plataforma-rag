# 🚀 Instalação Rápida do Node RAG no n8n

## Opção 1: Instalação via npm (Recomendado)

Se você tem acesso ao terminal do servidor n8n:

```bash
# Conecte-se ao servidor n8n (Docker, VPS, etc.)
cd /path/to/n8n  # ou onde o n8n está instalado

# Instale o pacote
npm install @rag-system/n8n-nodes-rag

# Reinicie o n8n
# Se Docker: docker restart n8n
# Se systemd: systemctl restart n8n
# Se manual: reinicie o processo
```

## Opção 2: Instalação via GitHub (Sem npm publish)

Se o pacote ainda não está no npm, você pode instalar diretamente do GitHub:

```bash
# No servidor n8n
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag

# Ou se preferir uma branch específica:
npm install https://github.com/ftsmazzo/sistema-rag.git#main:n8n-node-rag

# Reinicie o n8n
```

## Opção 3: Instalação Manual (Docker)

Se você usa Docker e não tem acesso direto:

```bash
# 1. Entre no container do n8n
docker exec -it <nome-do-container-n8n> sh

# 2. Instale o pacote
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag

# 3. Saia do container
exit

# 4. Reinicie o container
docker restart <nome-do-container-n8n>
```

## Opção 4: Via EasyPanel (Se n8n está no EasyPanel)

1. Acesse o terminal do serviço n8n no EasyPanel
2. Execute:
```bash
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag
```
3. Reinicie o serviço

## ✅ Verificar Instalação

Após reiniciar o n8n:

1. Abra o n8n
2. Crie um novo workflow
3. Clique em **+** para adicionar node
4. Procure por **"RAG Knowledge Base"** ou **"RAG"**
5. Se aparecer, está instalado! 🎉

## 🔧 Configurar Credenciais

1. No n8n, vá em **Settings** → **Credentials**
2. Clique em **Add Credential**
3. Procure por **"RAG API"**
4. Preencha:
   - **API URL**: `https://seu-app.easypanel.host` (sua URL do RAG)
   - **API Key**: Sua chave API (sk_...)
5. Clique em **Test** para validar
6. Salve

## 🎯 Usar o Node

1. Arraste o node **"RAG Knowledge Base"** para o canvas
2. Selecione a operação:
   - **Query Knowledge Base**: Para fazer perguntas
   - **List Knowledge Bases**: Para listar bases
3. Configure:
   - Selecione a base (dropdown carrega automaticamente)
   - Digite sua pergunta
   - Ajuste Top K se necessário
4. Execute o workflow!

## 🐛 Problemas?

### Node não aparece
- Verifique se instalou corretamente: `npm list | grep rag`
- Verifique logs do n8n para erros
- Certifique-se de ter reiniciado o n8n

### Erro ao carregar bases
- Verifique se a API URL está correta
- Verifique se a API Key está ativa
- Teste a API manualmente: `curl -H "Authorization: Bearer sk_..." https://seu-app/api/knowledge-bases`

### Erro de compilação
- O pacote já vem compilado, mas se precisar:
```bash
cd node_modules/@rag-system/n8n-nodes-rag
npm install
npm run build
```
