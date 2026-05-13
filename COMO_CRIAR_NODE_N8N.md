# Como Criar e Publicar o Node Customizado do n8n

## 📋 Visão Geral

Este guia explica como criar, testar e publicar o node customizado do n8n para o sistema RAG.

## 🎯 Objetivo

Criar um node que simplifica o uso do sistema RAG no n8n:
- ✅ Interface amigável (sem precisar configurar HTTP manualmente)
- ✅ Lista automática de bases de conhecimento
- ✅ Validação de credenciais
- ✅ Tratamento de erros melhorado

## 📦 Estrutura Criada

```
n8n-node-rag/
├── credentials/
│   └── RAGApi.credentials.ts    # Credenciais simplificadas
├── nodes/
│   └── RAG/
│       └── RAG.node.ts          # Node principal
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Passos para Publicar

### 1. Desenvolvimento Local

```bash
cd n8n-node-rag
npm install
npm run build
```

### 2. Testar Localmente no n8n

#### Opção A: n8n Self-Hosted

1. Copie a pasta `n8n-node-rag` para `~/.n8n/custom/`
2. Reinicie o n8n
3. O node aparecerá na lista de nodes

#### Opção B: n8n Docker

```bash
# Monte o diretório como volume
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/n8n-node-rag:/home/node/.n8n/custom/n8n-node-rag \
  n8nio/n8n
```

### 3. Publicar no npm

```bash
# 1. Verificar se está tudo OK
npm run lint
npm run build

# 2. Publicar (precisa estar logado no npm)
npm publish --access public
```

### 4. Usuários Instalam

```bash
# No servidor n8n
npm install @rag-system/n8n-nodes-rag

# Reiniciar n8n
```

## 🎨 Funcionalidades do Node

### Credenciais

- **API URL**: URL base da instalação RAG
- **API Key**: Chave de API (sk_...)
- **Test automático**: Valida conexão ao salvar

### Operações

1. **Query Knowledge Base**
   - Dropdown com bases disponíveis (carregado automaticamente)
   - Campo de query/pergunta
   - Top K configurável
   - Retorna resposta da IA + fontes

2. **List Knowledge Bases**
   - Lista todas as bases
   - Útil para debug ou workflows dinâmicos

## 🔧 Melhorias Futuras

- [ ] Upload de documentos via node
- [ ] Gerenciamento de bases (criar, atualizar, deletar)
- [ ] Suporte a múltiplas bases em uma query
- [ ] Cache de resultados
- [ ] Métricas e analytics

## 📚 Recursos

- [Documentação n8n Community Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/build/node/)
- [n8n Credentials Guide](https://docs.n8n.io/integrations/creating-nodes/build/credentials/)

## 🐛 Troubleshooting

### Node não aparece no n8n

1. Verifique se compilou: `npm run build`
2. Verifique se está na pasta correta: `~/.n8n/custom/`
3. Verifique logs do n8n para erros

### Erro ao carregar bases

1. Verifique se a API está acessível
2. Verifique se a API Key está correta
3. Verifique logs do n8n

### Erro de compilação TypeScript

1. Verifique versão do TypeScript: `npm list typescript`
2. Limpe e reinstale: `rm -rf node_modules dist && npm install`

## 💡 Dicas

- Use `npm run dev` para watch mode durante desenvolvimento
- Teste sempre com diferentes cenários (bases vazias, erros de API, etc.)
- Mantenha a documentação atualizada
- Considere versionamento semântico ao publicar
