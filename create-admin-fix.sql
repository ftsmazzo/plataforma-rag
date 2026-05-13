-- Script corrigido para criar usuário admin
-- Execute este SQL no PostgreSQL

-- 1. Criar organização padrão se não existir
INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Criar ou atualizar usuário admin
WITH org AS (
  SELECT id FROM organizations WHERE slug = 'default' LIMIT 1
)
INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
SELECT 
  'fredmazzo@gmail.com',
  '$2a$10$slLivZB6fK4fztvk3rJaQOFhJ7RfS7lCqljudIChyNoz5QlvgigBG',
  'Frederico Mazzo',
  'admin',  -- CORRIGIDO: deve ser 'admin', não 'fabrica'
  org.id,
  NOW(),
  NOW(),
  NOW()
FROM org
ON CONFLICT (email) DO UPDATE
SET 
  role = 'admin',
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  "updatedAt" = NOW();

-- Verificar se foi criado
SELECT id, email, name, role, "organizationId" FROM users WHERE email = 'fredmazzo@gmail.com';
