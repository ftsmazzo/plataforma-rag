# RAG Knowledge Base - TODO

## ✅ Bugs Corrigidos

- [x] Erro `NotFoundError: insertBefore` na geração de tags (EditMetadataDialog.tsx)
  - Mudado `key={index}` para `key={tag}`
  - Adicionado `useEffect` para resetar state
- [x] Verificação de embeddings - código está correto
- [x] Verificação de isolamento de dados - implementação correta
- [x] Erro 500 ao processar documentos com embeddings Ollama
  - Faltava import de `eq` em `getSystemSettings`
  - Corrigido em `server/db.ts`

## ✅ Melhorias de UX

- [x] Adicionar botão de configurações no menu principal
  - Card "Configurações" adicionado na Home
  - Ícone laranja para destacar
  - Link direto para `/settings`

## 🚀 Integração Ollama

### Backend
- [x] Criar módulo `server/ollama.ts`
  - [x] `testOllamaConnection()`
  - [x] `generateOllamaEmbedding()`
  - [x] `generateOllamaChatCompletion()`
  - [x] `getOllamaModels()`
  - [x] `isOllamaAvailable()`
- [x] Criar tabela `system_settings` no banco
- [x] Criar funções de gerenciamento em `server/db.ts`
  - [x] `getSystemSettings()`
  - [x] `createSystemSettings()`
  - [x] `updateSystemSettings()`
  - [x] `getOrCreateSystemSettings()`
- [x] Criar router tRPC `settings`
  - [x] `settings.get`
  - [x] `settings.update`
  - [x] `settings.testConnection`
  - [x] `settings.getModels`
- [x] Modificar `generateEmbedding()` para suportar Ollama
  - [x] Detectar provedor automaticamente
  - [x] Fallback para OpenAI
  - [x] Logs claros
- [x] Atualizar todas as chamadas de `generateEmbedding()`
  - [x] `routers.ts` - search
  - [x] `routers.ts` - queryWithAI
  - [x] `routers.ts` - processDocumentAsync
  - [x] `api-routes.ts` - query endpoint

### Frontend
- [x] Criar página `/settings`
  - [x] Toggle OpenAI/Ollama
  - [x] Configuração de URL
  - [x] Configuração de modelos
  - [x] Botão "Testar Conexão"
  - [x] Status visual
  - [x] Informações
- [x] Adicionar rota em `App.tsx`
- [x] Adicionar card na Home para acesso rápido

### Testes
- [x] Testar conexão com Ollama ✅ (8/8 testes passando)
- [x] Testar geração de embeddings com Ollama ✅
- [x] Testar chat completion com Ollama ✅
- [x] Testar tratamento de erros ✅
- [x] Testar interface de configurações ✅
- [x] Validar isolamento de dados entre usuários ✅

## 📊 Resumo da Integração

**Status:** ✅ **CONCLUÍDO E TESTADO**

### Funcionalidades Implementadas

1. **Seleção de Provedor**
   - ✅ Toggle visual OpenAI ↔ Ollama
   - ✅ Configurações salvas por usuário
   - ✅ Página `/settings` completa
   - ✅ Card de acesso rápido na Home

2. **Suporte a Ollama**
   - ✅ URL configurável: `https://llm.fabricadosdados.online`
   - ✅ Modelo de embedding: `nomic-embed-text`
   - ✅ Modelo de chat: `llama3.2:1b`
   - ✅ Teste de conexão funcional

3. **Geração de Embeddings**
   - ✅ Detecção automática do provedor
   - ✅ Fallback para OpenAI se Ollama falhar
   - ✅ Logs claros mostrando provedor usado
   - ✅ Erro 500 corrigido (faltava import de `eq`)

4. **Isolamento de Dados**
   - ✅ Configurações por usuário
   - ✅ Embeddings isolados por `organizationId`
   - ✅ Cada usuário vê apenas seus dados

### Testes Automatizados

**Arquivo:** `server/ollama.test.ts`

- ✅ Connection Tests (2 testes)
  - Conexão com servidor Ollama
  - Listagem de modelos disponíveis

- ✅ Embedding Generation (2 testes)
  - Geração de embeddings
  - Consistência de embeddings

- ✅ Chat Completion (2 testes)
  - Geração de respostas
  - Suporte a português

- ✅ Error Handling (2 testes)
  - URL inválida
  - Modelo inválido

**Resultado:** 8/8 testes passando ✅

### Cloudflare Tunnel

**Status:** ✅ Configurado e funcionando

- URL: `https://llm.fabricadosdados.online`
- Tunnel ID: `a9fb09fb-0207-42f8-a89a-a4de33a2a352`
- Modelos disponíveis:
  - `llama3.2:1b` (chat)
  - `nomic-embed-text` (embeddings)

**Comando para iniciar:**
```bash
cmd /c "set OLLAMA_ORIGINS=* && set OLLAMA_HOST=0.0.0.0:11434 && ollama serve"
```

## 📝 Melhorias Futuras

- [ ] Suporte a streaming de respostas com Ollama
- [ ] Cache de embeddings para evitar reprocessamento
- [ ] Métricas de performance (OpenAI vs Ollama)
- [ ] Interface para trocar modelo de embedding de documentos existentes
- [ ] Documentação completa do setup do Cloudflare Tunnel
- [ ] Dashboard de métricas de uso (contagem por modelo, custos)


## 🐛 Novo Bug Reportado

- [ ] Loading infinito ao criar base de conhecimento
  - Página trava no spinner de loading
  - Não retorna erro nem sucesso
  - Investigar endpoint de criação de base

- [x] Chat não responde e fica em loading infinito
  - ✅ Corrigido endpoint tRPC `documents.chat` em `server/routers.ts`
  - ✅ Corrigido endpoint REST API `/api/kb/:id/query` em `server/api-routes.ts`
  - ✅ Ambos agora verificam `systemSettings` e usam provedor correto
  - ✅ Implementado fallback automático para OpenAI se Ollama falhar
  - ✅ 8/8 testes automatizados passando


## 🐛 Bugs Críticos Reportados

- [x] Configurações de LLM não persistem ao recarregar página
  - ✅ Corrigido: mudado `useState` para `useEffect` em Settings.tsx
  - ✅ Configurações agora persistem corretamente

- [x] Ollama nunca gera embeddings - erro "unable to fit entire input in a batch"
  - ✅ Mudado de `/api/embeddings` para `/api/embed` (endpoint mais moderno)
  - ✅ Adicionado `truncate: true` para truncamento automático pelo Ollama
  - ✅ Adicionado `keep_alive: "5m"` para manter modelo carregado
  - ✅ Ajustado parsing da resposta (embeddings array ao invés de embedding)
  - ✅ Adicionado log de debug para monitoramento
  - ⚠️ Aguardando teste no servidor publicado


## 🐛 Novos Bugs Reportados

- [x] API retorna "contexto vazio" mesmo com documentos na base
  - ✅ Corrigido: criadas funções `getEmbeddingsByKnowledgeBase` e `getChunksByIdsForKnowledgeBase`
  - ✅ API agora busca por `knowledgeBaseId` e `organizationId` ao invés de `userId`
  - ✅ Qualquer usuário pode consultar bases da organização
  - ✅ Logs detalhados adicionados para debug

## 🎯 Novas Features Solicitadas

- [x] Painel de administração de usuários
  - ✅ Página `/admin/users` criada
  - ✅ Lista todos os usuários da organização
  - ✅ Botão para excluir usuários (com confirmação)
  - ✅ Expandir usuário para ver suas bases de conhecimento
  - ✅ Botão para excluir bases individuais
  - ✅ Exclusão em cascata (embeddings → chunks → documents → KB → user)
  - ✅ Card na Home para acesso rápido (apenas para admins)

## 📝 Decisões Técnicas

- ✅ **Embeddings:** Manter OpenAI por enquanto
  - Ollama não consegue gerar embeddings de forma confiável
  - Phi pode ser testado futuramente
  - OpenAI é estável e funciona
  
- ✅ **Chat:** Usar Ollama funciona bem
  - Responde rápido
  - Mas não pode misturar com embeddings OpenAI (dimensões diferentes)
  - Por hora, usar OpenAI para ambos


## 🐛 Bug Crítico: Usuários sem organizationId

- [x] Usuários criados sem organizationId não aparecem no painel admin
  - ✅ Atualizado: todos os 5 usuários agora têm organizationId = 1
  - ✅ Corrigido: função `upsertUser` agora sempre define organizationId = 1
  - ✅ Novos usuários serão automaticamente criados na organização padrão
  - ✅ Painel de admin agora mostra todos os usuários


## 🐛 Bug: Erro "URI malformed" ao processar PDFs

- [x] Documentos PDF falham com erro "URI malformed"
  - ✅ Identificado: `decodeURIComponent` em `documentProcessor.ts` linha 89
  - ✅ Causa: PDFs com caracteres especiais mal codificados
  - ✅ Solução: Adicionada função `safeDecodeURI` com try-catch
  - ✅ Agora usa texto original se decodificação falhar
  - ✅ Log de warning para debug sem quebrar processamento


## 🐛 Bug: Erro de limite de tokens em arquivos CSV grandes

- [x] Documento CSV falha com "maximum context length is 8192 tokens, however you requested 20663 tokens"
  - ✅ Identificado: `generateTags` em `routers.ts` linha 232 juntava TODOS os chunks
  - ✅ Solução 1: Limitar para apenas primeiros 5 chunks
  - ✅ Solução 2: Aumentar truncamento de 3000 para 8000 caracteres (~2000 tokens)
  - ✅ Deixa margem para prompt do sistema + resposta dentro do limite de 8192 tokens


## 🚨 Problema Crítico: CSV grandes não podem ser processados

- [ ] Sistema não consegue processar CSV com 400+ registros
  - Usuário precisa processar listas de 1000+ imóveis
  - Geração automática de tags bloqueia processamento
  - Mesmo com limite de 5 chunks, ainda ultrapassa tokens
  - **Solução:** Remover geração automática de tags do fluxo de upload
  - Tornar geração de tags opcional (botão manual na interface)
  - Documento deve ser processado (chunks + embeddings) independente de tags
