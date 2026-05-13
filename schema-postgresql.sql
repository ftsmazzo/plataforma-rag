-- ============================================
-- RAG Knowledge Base System - PostgreSQL Schema
-- ============================================
-- Sistema de Base de Conhecimento RAG com suporte multi-tenant
-- Criado para processamento de documentos (PDF, CSV, Excel, imagens)
-- com busca semântica usando embeddings vetoriais com pgvector
-- ============================================

-- Habilitar extensão pgvector (execute primeiro!)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Tabelas
-- ============================================

-- Tabela de Organizações (Multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo TEXT,
  settings TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS isActive_idx ON organizations("isActive");

-- Tabela de Bases de Conhecimento
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "userId" INTEGER NOT NULL,
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "webhookUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS userId_idx ON knowledge_bases("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON knowledge_bases("organizationId");
CREATE INDEX IF NOT EXISTS isActive_idx ON knowledge_bases("isActive");

-- Tabela de Usuários (com autenticação email/password)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name TEXT,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "organizationId" INTEGER REFERENCES organizations(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS organizationId_idx ON users("organizationId");

-- Tabela de Documentos
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "knowledgeBaseId" INTEGER NOT NULL REFERENCES knowledge_bases(id),
  filename VARCHAR(255) NOT NULL,
  "originalFilename" VARCHAR(255) NOT NULL,
  "fileType" VARCHAR(50) NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" VARCHAR(512) NOT NULL,
  "storageUrl" TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  "errorMessage" TEXT,
  metadata TEXT,
  tags TEXT,
  description TEXT,
  "totalChunks" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS userId_idx ON documents("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON documents("organizationId");
CREATE INDEX IF NOT EXISTS knowledgeBaseId_idx ON documents("knowledgeBaseId");
CREATE INDEX IF NOT EXISTS status_idx ON documents(status);

-- Tabela de Chunks de Documentos
CREATE TABLE IF NOT EXISTS document_chunks (
  id SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES documents(id),
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "knowledgeBaseId" INTEGER NOT NULL REFERENCES knowledge_bases(id),
  "chunkIndex" INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  "tokenCount" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documentId_idx ON document_chunks("documentId");
CREATE INDEX IF NOT EXISTS userId_idx ON document_chunks("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON document_chunks("organizationId");
CREATE INDEX IF NOT EXISTS knowledgeBaseId_idx ON document_chunks("knowledgeBaseId");

-- Tabela de Embeddings Vetoriais (com pgvector)
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  "chunkId" INTEGER NOT NULL UNIQUE REFERENCES document_chunks(id),
  "documentId" INTEGER NOT NULL REFERENCES documents(id),
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "knowledgeBaseId" INTEGER NOT NULL REFERENCES knowledge_bases(id),
  embedding vector(1536), -- OpenAI text-embedding-3-small tem 1536 dimensões
  "embeddingModel" VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chunkId_idx ON embeddings("chunkId");
CREATE INDEX IF NOT EXISTS documentId_idx ON embeddings("documentId");
CREATE INDEX IF NOT EXISTS userId_idx ON embeddings("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON embeddings("organizationId");
CREATE INDEX IF NOT EXISTS knowledgeBaseId_idx ON embeddings("knowledgeBaseId");

-- Criar índice vetorial para busca semântica (execute após inserir dados)
-- CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
-- USING ivfflat (embedding vector_cosine_ops) 
-- WITH (lists = 100);

-- Tabela de Versões de Documentos
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  "documentId" INTEGER NOT NULL REFERENCES documents(id),
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "versionNumber" INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  "storageKey" VARCHAR(512) NOT NULL,
  "storageUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  tags TEXT,
  description TEXT,
  "changeDescription" TEXT,
  "totalChunks" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documentId_idx ON document_versions("documentId");
CREATE INDEX IF NOT EXISTS userId_idx ON document_versions("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON document_versions("organizationId");

-- Tabela de Feedback de Usuários
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER REFERENCES organizations(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  "adminResponse" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS userId_idx ON feedback("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON feedback("organizationId");
CREATE INDEX IF NOT EXISTS status_idx ON feedback(status);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER REFERENCES organizations(id),
  type VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "relatedEntityType" VARCHAR(50),
  "relatedEntityId" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS userId_idx ON notifications("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON notifications("organizationId");
CREATE INDEX IF NOT EXISTS isRead_idx ON notifications("isRead");
CREATE INDEX IF NOT EXISTS createdAt_idx ON notifications("createdAt");

-- Tabela de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(64) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "rateLimit" INTEGER NOT NULL DEFAULT 60,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS key_idx ON api_keys(key);
CREATE INDEX IF NOT EXISTS userId_idx ON api_keys("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON api_keys("organizationId");
CREATE INDEX IF NOT EXISTS isActive_idx ON api_keys("isActive");

-- Tabela de Logs de API
CREATE TABLE IF NOT EXISTS api_logs (
  id SERIAL PRIMARY KEY,
  "apiKeyId" INTEGER NOT NULL REFERENCES api_keys(id),
  "knowledgeBaseId" INTEGER NOT NULL REFERENCES knowledge_bases(id),
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  "sourcesCount" INTEGER NOT NULL DEFAULT 0,
  "responseTime" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apiKeyId_idx ON api_logs("apiKeyId");
CREATE INDEX IF NOT EXISTS knowledgeBaseId_idx ON api_logs("knowledgeBaseId");
CREATE INDEX IF NOT EXISTS userId_idx ON api_logs("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON api_logs("organizationId");
CREATE INDEX IF NOT EXISTS createdAt_idx ON api_logs("createdAt");

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "organizationId" INTEGER NOT NULL REFERENCES organizations(id),
  "llmProvider" VARCHAR(50) NOT NULL DEFAULT 'openai',
  "ollamaBaseUrl" TEXT,
  "ollamaEmbeddingModel" VARCHAR(100),
  "ollamaChatModel" VARCHAR(100),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastTestedAt" TIMESTAMP,
  "lastTestStatus" VARCHAR(50),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS userId_idx ON system_settings("userId");
CREATE INDEX IF NOT EXISTS organizationId_idx ON system_settings("organizationId");
CREATE INDEX IF NOT EXISTS llmProvider_idx ON system_settings("llmProvider");

-- ============================================
-- Dados Iniciais
-- ============================================

-- Inserir organização padrão
INSERT INTO organizations (name, slug, description, "isActive") 
VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Função para atualizar updatedAt automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updatedAt
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_bases_updated_at BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_versions_updated_at BEFORE UPDATE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Notas Importantes
-- ============================================
-- 1. Este schema usa PostgreSQL com extensão pgvector
-- 2. Embeddings são armazenados como tipo vector(1536) do pgvector
-- 3. Busca semântica usa operadores do pgvector (vector_cosine_ops)
-- 4. Sistema suporta multi-tenancy via organizationId
-- 5. Suporta múltiplas bases de conhecimento por organização
-- 6. API Keys para integração externa (n8n, webhooks)
-- 7. Suporta OpenAI e Ollama como provedores de LLM
-- 8. O índice vetorial ivfflat deve ser criado após inserir dados
-- ============================================
