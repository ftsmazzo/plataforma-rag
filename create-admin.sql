-- Script para criar um usuário admin
-- Execute este script no PostgreSQL para criar um usuário admin

-- IMPORTANTE: Substitua 'admin@example.com' pelo email desejado
-- IMPORTANTE: Substitua 'senha123' pela senha desejada
-- A senha será hasheada usando bcrypt

-- Primeiro, certifique-se de que existe pelo menos uma organização
-- Se não existir, crie uma:
INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Obter o ID da organização padrão (ou criar se não existir)
DO $$
DECLARE
    org_id INTEGER;
    hashed_password TEXT;
BEGIN
    -- Obter ou criar organização padrão
    SELECT id INTO org_id FROM organizations WHERE slug = 'default' LIMIT 1;
    
    IF org_id IS NULL THEN
        INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
        VALUES ('Organização Padrão', 'default', 'Organização padrão do sistema', true, NOW(), NOW())
        RETURNING id INTO org_id;
    END IF;

    -- Hash da senha usando bcrypt
    -- IMPORTANTE: Substitua 'senha123' pela senha desejada
    -- Você pode gerar o hash usando Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('senha123', 10)
    -- Ou usar um gerador online: https://bcrypt-generator.com/
    -- Exemplo de hash para 'senha123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
    hashed_password := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; -- senha: senha123

    -- Criar usuário admin
    INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
    VALUES (
        'admin@example.com',  -- SUBSTITUA pelo email desejado
        hashed_password,      -- Hash da senha (substitua pelo hash da sua senha)
        'Administrador',     -- Nome do admin
        'admin',              -- Role admin
        org_id,               -- ID da organização
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET role = 'admin',
        password = hashed_password,
        "updatedAt" = NOW();
    
    RAISE NOTICE 'Usuário admin criado com sucesso!';
    RAISE NOTICE 'Email: admin@example.com';
    RAISE NOTICE 'Senha: senha123';
    RAISE NOTICE 'IMPORTANTE: Altere a senha após o primeiro login!';
END $$;
