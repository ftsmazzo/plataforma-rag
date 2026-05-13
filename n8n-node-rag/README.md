# n8n RAG Knowledge Base Node

Node customizado do n8n para integração simplificada com o sistema RAG Knowledge Base.

## 🚀 Instalação

### ⭐ Instalação via npm (RECOMENDADO - Mais Fácil!)

```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```

Depois, **reinicie o n8n**. Pronto! ✅

### Opção 2: Instalação manual (se npm não funcionar)

1. Clone este repositório
2. Execute `npm install` na pasta `n8n-node-rag`
3. Execute `npm run build`
4. Copie a pasta `n8n-node-rag` para a pasta `custom` do seu n8n

## 📖 Como Usar

### 1. Configurar Credenciais

1. No n8n, vá em **Credentials** → **Add Credential**
2. Procure por **"RAG API"**
3. Preencha:
   - **API URL**: URL da sua instalação (ex: `https://seu-app.easypanel.host`)
   - **API Key**: Sua chave API (começa com `sk_`)
4. Clique em **Test** para verificar a conexão
5. Salve as credenciais

### 2. Adicionar o Node

1. No seu workflow, clique em **+** para adicionar um node
2. Procure por **"RAG Knowledge Base"**
3. Arraste o node para o canvas

### 3. Operações Disponíveis

#### Query Knowledge Base (Consultar Base de Conhecimento)

- **Knowledge Base**: Dropdown que lista automaticamente suas bases ativas
- **Query**: Sua pergunta ou busca
- **Top K Results**: Número de resultados (1-20, padrão: 5)

**Saída:**
```json
{
  "answer": "Resposta da IA baseada nos documentos...",
  "sources": [
    {
      "documentId": 123,
      "chunkId": 456,
      "content": "Trecho relevante...",
      "similarity": 0.92
    }
  ],
  "knowledgeBase": {
    "id": 1,
    "name": "Minha Base"
  }
}
```

#### List Knowledge Bases (Listar Bases)

Lista todas as bases de conhecimento disponíveis.

**Saída:**
```json
{
  "knowledgeBases": [
    {
      "id": 1,
      "name": "Base 1",
      "description": "Descrição...",
      "isActive": true
    }
  ],
  "count": 1
}
```

## 🎯 Exemplos de Uso

### Exemplo 1: Chatbot com RAG

```
Webhook → RAG Query → Respond to Webhook
```

### Exemplo 2: Busca Automatizada

```
Schedule Trigger → RAG Query → Send Email
```

### Exemplo 3: Integração com WhatsApp

```
WhatsApp Trigger → RAG Query → WhatsApp Send
```

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Modo desenvolvimento (watch)
npm run dev

# Lint
npm run lint

# Formatar código
npm run format
```

## 📝 Estrutura

```
n8n-node-rag/
├── credentials/          # Definição de credenciais
│   └── RAGApi.credentials.ts
├── nodes/                 # Nodes customizados
│   └── RAG/
│       └── RAG.node.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### Erro: "Invalid API key"
- Verifique se a API Key está correta
- Certifique-se de que a API Key está ativa no sistema RAG

### Erro: "Knowledge base not found"
- Verifique se a base de conhecimento está ativa
- Certifique-se de que você tem permissão para acessar a base

### Dropdown de bases vazio
- Verifique se você tem bases de conhecimento criadas
- Certifique-se de que pelo menos uma base está ativa
- Verifique a conexão com a API

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.
