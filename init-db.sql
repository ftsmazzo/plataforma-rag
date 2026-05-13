-- Initialize PostgreSQL database with pgvector extension
-- This script runs automatically on first container startup

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE rag_knowledge_base TO raguser;

-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO raguser;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized with pgvector extension';
END $$;
