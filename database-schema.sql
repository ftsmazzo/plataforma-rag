-- ============================================
-- RAG Knowledge Base System - Database Schema
-- ============================================
-- Sistema de Base de Conhecimento RAG com suporte multi-tenant
-- Criado para processamento de documentos (PDF, CSV, Excel, imagens)
-- com busca semântica usando embeddings vetoriais
-- ============================================

-- Tabela de Organizações (Multi-tenant)
CREATE TABLE `organizations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'Nome da organização',
  `slug` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificador único URL-friendly',
  `description` TEXT COMMENT 'Descrição da organização',
  `logo` TEXT COMMENT 'URL da imagem do logo',
  `settings` TEXT COMMENT 'Configurações específicas em JSON',
  `isActive` INT NOT NULL DEFAULT 1 COMMENT '0 = inativa, 1 = ativa',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `slug_idx` (`slug`),
  INDEX `isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Bases de Conhecimento
CREATE TABLE `knowledge_bases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'Nome da base de conhecimento',
  `description` TEXT COMMENT 'Descrição da base',
  `userId` INT NOT NULL COMMENT 'ID do criador',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `webhookUrl` TEXT COMMENT 'URL do webhook para notificações (opcional)',
  `isActive` INT NOT NULL DEFAULT 1 COMMENT '0 = inativa, 1 = ativa',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Usuários
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE COMMENT 'ID único do OAuth',
  `name` TEXT COMMENT 'Nome do usuário',
  `email` VARCHAR(320) COMMENT 'Email do usuário',
  `loginMethod` VARCHAR(64) COMMENT 'Método de login usado',
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Papel do usuário',
  `organizationId` INT COMMENT 'ID da organização (NULL para super admins)',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `organizationId_idx` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Documentos
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL COMMENT 'ID do usuário que fez upload',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `knowledgeBaseId` INT NOT NULL COMMENT 'ID da base de conhecimento',
  `filename` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo gerado',
  `originalFilename` VARCHAR(255) NOT NULL COMMENT 'Nome original do arquivo',
  `fileType` VARCHAR(50) NOT NULL COMMENT 'Tipo: pdf, xlsx, csv, png, jpg, txt',
  `fileSize` INT NOT NULL COMMENT 'Tamanho em bytes',
  `s3Key` VARCHAR(512) NOT NULL COMMENT 'Chave do arquivo no S3',
  `s3Url` TEXT NOT NULL COMMENT 'URL completa do arquivo no S3',
  `status` ENUM('uploading', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'uploading',
  `errorMessage` TEXT COMMENT 'Mensagem de erro se falhou',
  `metadata` TEXT COMMENT 'Metadados adicionais em JSON',
  `tags` TEXT COMMENT 'Tags separadas por vírgula',
  `description` TEXT COMMENT 'Descrição fornecida pelo usuário',
  `totalChunks` INT DEFAULT 0 COMMENT 'Total de chunks criados',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `knowledgeBaseId_idx` (`knowledgeBaseId`),
  INDEX `status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Chunks de Documentos
CREATE TABLE `document_chunks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `documentId` INT NOT NULL COMMENT 'ID do documento original',
  `userId` INT NOT NULL COMMENT 'ID do usuário dono',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `knowledgeBaseId` INT NOT NULL COMMENT 'ID da base de conhecimento',
  `chunkIndex` INT NOT NULL COMMENT 'Índice do chunk no documento',
  `content` TEXT NOT NULL COMMENT 'Conteúdo textual do chunk',
  `metadata` TEXT COMMENT 'Metadados do chunk em JSON (página, seção, etc)',
  `tokenCount` INT COMMENT 'Número estimado de tokens',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `documentId_idx` (`documentId`),
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `knowledgeBaseId_idx` (`knowledgeBaseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Embeddings Vetoriais
CREATE TABLE `embeddings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `chunkId` INT NOT NULL UNIQUE COMMENT 'ID do chunk correspondente',
  `documentId` INT NOT NULL COMMENT 'ID do documento original',
  `userId` INT NOT NULL COMMENT 'ID do usuário dono',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `knowledgeBaseId` INT NOT NULL COMMENT 'ID da base de conhecimento',
  `embedding` TEXT NOT NULL COMMENT 'Array JSON de floats (vetor de embedding)',
  `embeddingModel` VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small' COMMENT 'Modelo usado',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `chunkId_idx` (`chunkId`),
  INDEX `documentId_idx` (`documentId`),
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `knowledgeBaseId_idx` (`knowledgeBaseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Versões de Documentos
CREATE TABLE `document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `documentId` INT NOT NULL COMMENT 'ID do documento original',
  `userId` INT NOT NULL COMMENT 'ID do usuário',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `versionNumber` INT NOT NULL COMMENT 'Número da versão',
  `filename` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo',
  `s3Key` VARCHAR(512) NOT NULL COMMENT 'Chave no S3',
  `s3Url` TEXT NOT NULL COMMENT 'URL no S3',
  `fileSize` INT NOT NULL COMMENT 'Tamanho em bytes',
  `tags` TEXT COMMENT 'Tags da versão',
  `description` TEXT COMMENT 'Descrição da versão',
  `changeDescription` TEXT COMMENT 'O que mudou nesta versão',
  `totalChunks` INT DEFAULT 0 COMMENT 'Total de chunks',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `documentId_idx` (`documentId`),
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Feedback de Usuários
CREATE TABLE `feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL COMMENT 'ID do usuário que enviou',
  `organizationId` INT COMMENT 'ID da organização (opcional)',
  `type` ENUM('bug', 'feature', 'improvement', 'other') NOT NULL COMMENT 'Tipo de feedback',
  `title` VARCHAR(255) NOT NULL COMMENT 'Título do feedback',
  `description` TEXT NOT NULL COMMENT 'Descrição detalhada',
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `adminResponse` TEXT COMMENT 'Resposta do administrador',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Notificações
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL COMMENT 'ID do admin que deve ver',
  `organizationId` INT COMMENT 'ID da organização (opcional)',
  `type` ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info',
  `title` VARCHAR(255) NOT NULL COMMENT 'Título da notificação',
  `message` TEXT NOT NULL COMMENT 'Mensagem completa',
  `isRead` INT NOT NULL DEFAULT 0 COMMENT '0 = não lida, 1 = lida',
  `relatedEntityType` VARCHAR(50) COMMENT 'Tipo da entidade relacionada (document, user, etc)',
  `relatedEntityId` INT COMMENT 'ID da entidade relacionada',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `isRead_idx` (`isRead`),
  INDEX `createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de API Keys
CREATE TABLE `api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'Nome descritivo (ex: "Integração n8n")',
  `key` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Chave da API',
  `userId` INT NOT NULL COMMENT 'Dono da chave',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `rateLimit` INT NOT NULL DEFAULT 60 COMMENT 'Requisições por minuto',
  `isActive` INT NOT NULL DEFAULT 1 COMMENT '0 = inativa, 1 = ativa',
  `lastUsedAt` TIMESTAMP NULL COMMENT 'Última vez que foi usada',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `key_idx` (`key`),
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs de API
CREATE TABLE `api_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `apiKeyId` INT NOT NULL COMMENT 'ID da chave API usada',
  `knowledgeBaseId` INT NOT NULL COMMENT 'ID da base consultada',
  `query` TEXT NOT NULL COMMENT 'Pergunta feita',
  `answer` TEXT NOT NULL COMMENT 'Resposta fornecida',
  `sourcesCount` INT NOT NULL DEFAULT 0 COMMENT 'Número de fontes usadas',
  `responseTime` INT NOT NULL COMMENT 'Tempo de resposta em ms',
  `userId` INT NOT NULL COMMENT 'Dono da chave API',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `apiKeyId_idx` (`apiKeyId`),
  INDEX `knowledgeBaseId_idx` (`knowledgeBaseId`),
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Configurações do Sistema
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL COMMENT 'Configurações por usuário',
  `organizationId` INT NOT NULL COMMENT 'ID da organização (isolamento multi-tenant)',
  
  -- Configuração de Provedor LLM
  `llmProvider` VARCHAR(50) NOT NULL DEFAULT 'openai' COMMENT '"openai" ou "ollama"',
  `ollamaBaseUrl` TEXT COMMENT 'URL do servidor Ollama (ex: https://llm.fabricadosdados.online)',
  `ollamaEmbeddingModel` VARCHAR(100) COMMENT 'Modelo de embedding (ex: "nomic-embed-text")',
  `ollamaChatModel` VARCHAR(100) COMMENT 'Modelo de chat (ex: "llama3.2:1b")',
  
  -- Status
  `isActive` INT NOT NULL DEFAULT 1 COMMENT '0 = inativa, 1 = ativa',
  `lastTestedAt` TIMESTAMP NULL COMMENT 'Última vez que conexão foi testada',
  `lastTestStatus` VARCHAR(50) COMMENT '"success" ou "failed"',
  
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `userId_idx` (`userId`),
  INDEX `organizationId_idx` (`organizationId`),
  INDEX `llmProvider_idx` (`llmProvider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Dados Iniciais
-- ============================================

-- Inserir organização padrão
INSERT INTO `organizations` (`name`, `slug`, `description`, `isActive`) 
VALUES ('Fábrica IA', 'fabrica-ia', 'Organização padrão do sistema', 1);

-- ============================================
-- Notas Importantes
-- ============================================
-- 1. Este schema usa MySQL/MariaDB
-- 2. Embeddings são armazenados como JSON (array de floats)
-- 3. Busca semântica é feita via cálculo de similaridade de cosseno em código
-- 4. Sistema suporta multi-tenancy via organizationId
-- 5. Suporta múltiplas bases de conhecimento por organização
-- 6. API Keys para integração externa (n8n, webhooks)
-- 7. Suporta OpenAI e Ollama como provedores de LLM
-- ============================================
