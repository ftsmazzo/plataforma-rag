# 🧪 Guia de Teste Rápido

## ✅ Pré-requisitos

1. Servidor n8n rodando (Docker, EasyPanel, VPS, etc.)
2. Acesso ao terminal do servidor n8n
3. Sistema RAG rodando e acessível
4. Uma API Key criada no sistema RAG

## 🚀 Instalação (1 comando)

No terminal do servidor n8n:

```bash
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag
```

**Importante**: Se der erro de compilação, execute:

```bash
cd node_modules/@rag-system/n8n-nodes-rag
npm install
npm run build
cd ../../..
```

## 🔄 Reiniciar n8n

- **Docker**: `docker restart <nome-container>`
- **EasyPanel**: Reinicie o serviço
- **Manual**: Reinicie o processo Node.js

## ✅ Verificar Instalação

1. Abra o n8n no navegador
2. Crie um novo workflow
3. Clique em **+** para adicionar node
4. Procure por **"RAG"** ou **"RAG Knowledge Base"**
5. ✅ Se aparecer, está instalado!

## 🔧 Configurar Credenciais

1. No n8n, vá em **Settings** → **Credentials**
2. Clique em **Add Credential**
3. Procure por **"RAG API"**
4. Preencha:
   - **API URL**: `https://seu-app.easypanel.host` (sua URL do RAG)
   - **API Key**: Sua chave API (começa com `sk_`)
5. Clique em **Test** para validar
6. ✅ Se passar, salve!

## 🎯 Teste Básico

### Teste 1: Listar Bases

1. Crie um workflow novo
2. Adicione o node **"RAG Knowledge Base"**
3. Selecione operação: **"List Knowledge Bases"**
4. Configure as credenciais
5. Execute o workflow
6. ✅ Deve retornar lista de bases

### Teste 2: Query (Consulta)

1. No mesmo workflow, mude a operação para **"Query Knowledge Base"**
2. Selecione uma base no dropdown
3. Digite uma pergunta: `"Qual é a política de reembolso?"`
4. Execute
5. ✅ Deve retornar resposta da IA + fontes

## 🐛 Problemas Comuns

### Node não aparece

```bash
# Verificar se instalou
npm list | grep rag

# Verificar logs do n8n
# Docker: docker logs <container>
# EasyPanel: Ver logs do serviço
```

**Solução**: Reinicie o n8n novamente

### Erro: "Cannot find module"

```bash
cd node_modules/@rag-system/n8n-nodes-rag
npm install
npm run build
```

### Erro ao carregar bases (dropdown vazio)

1. Verifique se a API URL está correta
2. Verifique se a API Key está ativa
3. Teste manualmente:
```bash
curl -H "Authorization: Bearer sk_..." https://seu-app/api/knowledge-bases
```

### Erro: "Invalid API key"

1. Verifique se copiou a API Key completa
2. Verifique se a API Key está ativa no sistema RAG
3. Tente criar uma nova API Key

## 📊 Resultado Esperado

### List Knowledge Bases
```json
{
  "knowledgeBases": [
    {
      "id": 1,
      "name": "Minha Base",
      "description": "...",
      "isActive": true
    }
  ],
  "count": 1
}
```

### Query Knowledge Base
```json
{
  "answer": "Resposta da IA...",
  "sources": [
    {
      "documentId": 123,
      "chunkId": 456,
      "content": "Trecho relevante...",
      "similarity": 0.92
    }
  ],
  "query": "sua pergunta",
  "topK": 5
}
```

## ✅ Checklist de Teste

- [ ] Node aparece na lista de nodes
- [ ] Credenciais são aceitas e testadas com sucesso
- [ ] List Knowledge Bases retorna dados
- [ ] Dropdown de bases carrega automaticamente
- [ ] Query retorna resposta da IA
- [ ] Fontes (sources) são retornadas corretamente

## 🎉 Pronto!

Se todos os testes passaram, o node está funcionando perfeitamente!

## 📝 Próximos Passos

- Criar workflows mais complexos
- Integrar com outros nodes (WhatsApp, Email, etc.)
- Usar em produção
