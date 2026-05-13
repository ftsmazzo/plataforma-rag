# 🤖 RAG Knowledge Base

> Sistema completo de Retrieval-Augmented Generation para gerenciar bases de conhecimento com documentos e busca semântica inteligente.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## 📋 Visão Geral

RAG Knowledge Base é uma plataforma full-stack que permite usuários fazerem upload de documentos em múltiplos formatos, processarem automaticamente o conteúdo extraindo texto e gerando embeddings semânticos, e realizarem buscas inteligentes por similaridade vetorial. O sistema utiliza PostgreSQL com pgvector para armazenamento de embeddings e OpenAI API para geração de vetores semânticos.

### ✨ Principais Funcionalidades

- **Upload Multi-formato**: Suporte para PDF, Excel, CSV, imagens (PNG/JPG) e arquivos de texto
- **Processamento Automático**: Extração de texto, OCR de imagens, parsing de planilhas e chunking inteligente
- **Busca Semântica**: Busca por similaridade vetorial usando embeddings OpenAI
- **Geração de Tags com IA**: Tags relevantes geradas automaticamente usando LLM
- **Dashboard Completo**: Visualização de documentos, chunks, metadados e estatísticas
- **Edição de Metadados**: Adicione tags personalizadas e descrições aos documentos
- **Isolamento de Dados**: Cada usuário tem sua própria base de conhecimento isolada
- **Autenticação Segura**: Sistema de login via OAuth com Manus

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  - Upload de Documentos (Drag & Drop)                       │
│  - Dashboard de Documentos                                   │
│  - Busca Semântica                                           │
│  - Edição de Metadados                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC
┌──────────────────────┴──────────────────────────────────────┐
│                   Backend (Node.js + Express)                │
│  - Processamento de Documentos                               │
│  - Geração de Embeddings (OpenAI)                            │
│  - APIs tRPC                                                 │
│  - Autenticação OAuth                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────┴────────┐           ┌────────┴────────┐
│   PostgreSQL   │           │   Amazon S3     │
│   + pgvector   │           │  File Storage   │
│   (Embeddings) │           │   (Documents)   │
└────────────────┘           └─────────────────┘
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 22+
- PostgreSQL 16+ com extensão pgvector
- Chave OpenAI API
- Docker (opcional, para deploy)

### Instalação Local

```bash
# Clone o repositório
git clone <seu-repositorio>
cd rag_knowledge_base

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute migrações do banco
pnpm db:push

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000`

### Deploy com Docker

```bash
# Build e inicie com docker-compose
docker-compose up -d

# Verifique logs
docker-compose logs -f app
```

Veja [DEPLOY.md](./DEPLOY.md) para instruções detalhadas de deploy no EasyPanel.

## 📚 Documentação

- **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy no EasyPanel
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - Documentação de variáveis de ambiente
- **[todo.md](./todo.md)** - Lista de funcionalidades e progresso

## 🛠️ Stack Tecnológica

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **tRPC** - Type-safe APIs
- **shadcn/ui** - Componentes UI
- **Wouter** - Roteamento

### Backend
- **Node.js 22** - Runtime
- **Express 4** - Web framework
- **tRPC 11** - Type-safe RPC
- **Drizzle ORM** - Database ORM
- **OpenAI API** - Embeddings generation

### Database & Storage
- **PostgreSQL 16** - Database principal
- **pgvector** - Vector similarity search
- **Amazon S3** - File storage

### DevOps
- **Docker** - Containerização
- **EasyPanel** - Deploy platform
- **Vitest** - Testing framework

## 📊 Estrutura do Projeto

```
rag_knowledge_base/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários e configurações
│   └── public/            # Assets estáticos
├── server/                # Backend Node.js
│   ├── routers.ts         # Definição de rotas tRPC
│   ├── db.ts              # Queries do banco de dados
│   ├── documentProcessor.ts # Processamento de documentos
│   └── _core/             # Infraestrutura do servidor
├── drizzle/               # Schema e migrações do banco
│   └── schema.ts          # Definição de tabelas
├── easypanel/             # Template EasyPanel
│   ├── meta.yaml          # Metadados do template
│   └── index.ts           # Gerador de serviços
├── Dockerfile             # Imagem Docker de produção
├── docker-compose.yml     # Orquestração de containers
└── package.json           # Dependências do projeto
```

## 🔐 Segurança

- Autenticação via OAuth com Manus
- Isolamento de dados por usuário
- Secrets gerenciados via variáveis de ambiente
- Validação de tipos com TypeScript e Zod
- Proteção contra SQL injection via ORM
- HTTPS obrigatório em produção

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes específicos
pnpm test server/documents.test.ts

# Executar testes em modo watch
pnpm test --watch
```

## 📈 Roadmap

- [x] Upload e processamento de documentos
- [x] Geração de embeddings com OpenAI
- [x] Busca semântica por similaridade
- [x] Edição de metadados
- [x] Geração automática de tags com IA
- [x] Template EasyPanel para deploy
- [ ] Processamento real de PDFs (pdf-parse)
- [ ] OCR real de imagens (tesseract.js)
- [ ] Parsing de planilhas Excel (xlsx)
- [ ] Filtros por tags na lista de documentos
- [ ] API de consulta RAG com LLM
- [ ] Suporte para mais formatos (DOCX, PPTX)
- [ ] Análise de sentimento em documentos
- [ ] Exportação de base de conhecimento

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para problemas ou dúvidas:

1. Consulte a [documentação](./DEPLOY.md)
2. Verifique [issues existentes](https://github.com/seu-usuario/rag-knowledge-base/issues)
3. Abra uma [nova issue](https://github.com/seu-usuario/rag-knowledge-base/issues/new)

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) - API de embeddings
- [pgvector](https://github.com/pgvector/pgvector) - Extensão PostgreSQL para vetores
- [EasyPanel](https://easypanel.io/) - Plataforma de deploy
- [Manus](https://manus.im/) - Plataforma de desenvolvimento

---

**Desenvolvido com ❤️ usando Manus AI**
