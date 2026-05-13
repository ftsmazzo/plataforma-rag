-- Script para verificar se o usuário foi criado corretamente
-- Execute este SQL para diagnosticar o problema

-- 1. Verificar se a tabela users existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'users'
) AS tabela_existe;

-- 2. Verificar se o usuário existe
SELECT 
  id, 
  email, 
  name, 
  role, 
  "organizationId",
  "createdAt",
  CASE 
    WHEN password IS NULL THEN 'SEM SENHA'
    WHEN LENGTH(password) < 20 THEN 'SENHA MUITO CURTA'
    ELSE 'OK'
  END AS status_senha
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 3. Listar todos os usuários (para debug)
SELECT 
  id, 
  email, 
  name, 
  role, 
  "organizationId",
  "createdAt"
FROM users 
ORDER BY "createdAt" DESC
LIMIT 10;

-- 4. Verificar se a organização existe
SELECT id, name, slug FROM organizations WHERE slug = 'default';

-- 5. Se o usuário não existir, criar novamente:
-- (Execute apenas se o usuário não existir)
DO $$
DECLARE
    org_id INTEGER;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se organização existe
    SELECT id INTO org_id FROM organizations WHERE slug = 'default' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE NOTICE 'Criando organização padrão...';
        INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
        VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true, NOW(), NOW())
        RETURNING id INTO org_id;
    END IF;
    
    -- Verificar se usuário existe
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'fredmazzo@gmail.com') INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'Criando usuário admin...';
        INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
        VALUES (
            'fredmazzo@gmail.com',
            '$2a$10$slLivZB6fK4fztvk3rJaQOFhJ7RfS7lCqljudIChyNoz5QlvgigBG',
            'Frederico Mazzo',
            'admin',
            org_id,
            NOW(),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Usuário criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário já existe. Atualizando para admin...';
        UPDATE users 
        SET 
            role = 'admin',
            password = '$2a$10$slLivZB6fK4fztvk3rJaQOFhJ7RfS7lCqljudIChyNoz5QlvgigBG',
            name = 'Frederico Mazzo',
            "updatedAt" = NOW()
        WHERE email = 'fredmazzo@gmail.com';
        RAISE NOTICE 'Usuário atualizado para admin!';
    END IF;
END $$;

-- 6. Verificar novamente após criação/atualização
SELECT 
  id, 
  email, 
  name, 
  role, 
  "organizationId",
  "createdAt"
FROM users 
WHERE email = 'fredmazzo@gmail.com';
