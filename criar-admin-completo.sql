-- Script completo para criar usuário admin
-- IMPORTANTE: Gere o hash da senha primeiro usando:
-- node gerar-hash-senha.js "sua-senha-aqui"

-- 1. Criar organização padrão se não existir
INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Criar ou atualizar usuário admin
-- SUBSTITUA 'SEU_EMAIL@exemplo.com' pelo seu email
-- SUBSTITUA 'HASH_AQUI' pelo hash gerado pelo script gerar-hash-senha.js
WITH org AS (
  SELECT id FROM organizations WHERE slug = 'default' LIMIT 1
)
INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
SELECT 
  'SEU_EMAIL@exemplo.com',  -- SUBSTITUA pelo seu email
  'HASH_AQUI',              -- SUBSTITUA pelo hash gerado (ex: $2a$10$...)
  'Administrador',
  'admin',
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

-- 3. Verificar se foi criado
SELECT id, email, name, role, "organizationId" 
FROM users 
WHERE email = 'SEU_EMAIL@exemplo.com';
