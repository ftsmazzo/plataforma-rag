#!/bin/bash
set -e

echo "🔄 Aguardando banco de dados estar pronto..."

# Extract connection details from DATABASE_URL if available
if [ -n "$DATABASE_URL" ]; then
  # Parse DATABASE_URL: postgresql://user:password@host:port/database
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"
  DB_USER="${DB_USER:-postgres}"
  DB_PASSWORD="${DB_PASSWORD:-postgres}"
  DB_NAME="${DB_NAME:-rag_knowledge_base}"
fi

# Wait for database to be ready
export PGPASSWORD="$DB_PASSWORD"
until psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; do
  echo "⏳ Banco de dados não está pronto ainda - aguardando..."
  sleep 2
done

echo "✅ Banco de dados está pronto!"

# Enable pgvector extension
echo "🔧 Habilitando extensão pgvector..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" || echo "⚠️  Aviso: Não foi possível criar extensão vector (pode já existir)"

# Check if tables already exist
echo "🔍 Verificando se as tabelas já existem..."
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null || echo "false")

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "✅ Tabelas já existem, pulando migrações..."
else
  # Run migrations
  echo "🚀 Executando migrações do banco de dados..."
  cd /app

  # Try to use drizzle-kit, but fallback to direct SQL if it fails
  if command -v drizzle-kit &> /dev/null; then
    echo "📦 Usando drizzle-kit para migrações..."
    drizzle-kit generate && drizzle-kit migrate || {
      echo "⚠️  drizzle-kit falhou, usando schema SQL direto..."
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/schema-postgresql.sql 2>&1 | grep -v "already exists" || echo "✅ Schema aplicado"
    }
  else
    echo "📦 drizzle-kit não encontrado, usando schema SQL direto..."
    if [ -f "/app/schema-postgresql.sql" ]; then
      # Suppress "already exists" notices
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/schema-postgresql.sql 2>&1 | grep -v "already exists" | grep -v "NOTICE" || echo "✅ Schema aplicado"
    else
      echo "❌ Arquivo schema-postgresql.sql não encontrado!"
    fi
  fi
  echo "✅ Migrações concluídas com sucesso!"
fi

# Create vector index for semantic search (if embeddings table exists)
echo "🔧 Criando índice vetorial para busca semântica..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
  CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
" 2>/dev/null || echo "⚠️  Aviso: Índice vetorial será criado quando houver dados"

# Auto-create admin if environment variables are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "👤 Configurando usuário Admin automático..."
  node /app/create-admin.js || echo "⚠️  Aviso: Falha ao criar usuário admin. Verifique os logs."
fi

# Start the application
echo "🚀 Iniciando aplicação..."
exec "$@"
