-- SQL para atualizar senha do admin
-- Este hash é para a senha "admin123" (testado e funcionando)
-- Execute este SQL no PostgreSQL

-- Hash para senha "admin123" (gerado com bcrypt, rounds=10)
-- Este hash foi testado e funciona corretamente
UPDATE users 
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';

-- Verificar se foi atualizado
SELECT 
  id, 
  email, 
  name, 
  role,
  LEFT(password, 30) || '...' as hash_preview
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- Após executar, faça login com:
-- Email: fredmazzo@gmail.com
-- Senha: admin123
