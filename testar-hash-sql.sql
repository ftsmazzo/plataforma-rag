-- Teste de Hash Direto no PostgreSQL
-- Este SQL ajuda a verificar se o hash está correto

-- 1. Ver o hash atual
SELECT 
  email,
  password as hash_atual,
  LENGTH(password) as tamanho,
  LEFT(password, 7) as inicio_hash
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 2. Hash correto para senha "admin123" (bcrypt, rounds=10)
-- Use este hash se o atual estiver errado:
UPDATE users 
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';

-- 3. Verificar após atualização
SELECT 
  email,
  LEFT(password, 30) || '...' as hash_preview,
  LENGTH(password) as tamanho,
  CASE 
    WHEN password LIKE '$2a$10$%' THEN '✅ Formato correto (bcrypt $2a$10$)'
    WHEN password LIKE '$2b$10$%' THEN '✅ Formato correto (bcrypt $2b$10$)'
    ELSE '❌ Formato incorreto'
  END as formato
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 4. Verificar se não há espaços ou quebras de linha
SELECT 
  email,
  password,
  LENGTH(password) as tamanho_original,
  LENGTH(TRIM(password)) as tamanho_sem_espacos,
  CASE 
    WHEN LENGTH(password) != LENGTH(TRIM(password)) THEN '⚠️ ATENÇÃO: Hash tem espaços!'
    ELSE '✅ Sem espaços'
  END as status_espacos
FROM users 
WHERE email = 'fredmazzo@gmail.com';
