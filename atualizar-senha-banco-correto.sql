-- Atualizar senha no banco CORRETO
-- Hash para senha "admin123" (bcrypt, rounds=10, testado e funcionando)

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
  LEFT(password, 30) || '...' as hash_preview,
  LENGTH(password) as hash_length,
  CASE 
    WHEN password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' THEN '✅ Hash correto'
    ELSE '❌ Hash ainda incorreto'
  END as status
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- Após executar, faça login com:
-- Email: fredmazzo@gmail.com
-- Senha: admin123
