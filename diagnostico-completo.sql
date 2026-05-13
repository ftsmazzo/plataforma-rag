-- Diagnóstico Completo do Problema de Login
-- Execute este SQL no PostgreSQL para verificar tudo

-- 1. Verificar se o usuário existe
SELECT 
  id, 
  email, 
  name, 
  role,
  "organizationId",
  "createdAt",
  "updatedAt"
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 2. Verificar o hash da senha (detalhado)
SELECT 
  id,
  email,
  -- Mostrar informações sobre o hash
  LENGTH(password) as hash_length,
  LEFT(password, 10) as hash_start,
  RIGHT(password, 10) as hash_end,
  -- Verificar se tem espaços ou caracteres estranhos
  password LIKE '% %' as tem_espacos,
  password ~ '[^$a-zA-Z0-9./]' as tem_caracteres_estranhos,
  -- Hash completo (cuidado: pode ser longo)
  password as hash_completo
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 3. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'password';

-- 4. Verificar se há múltiplos usuários com o mesmo email
SELECT COUNT(*) as total_usuarios
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- 5. Limpar e recriar o hash (CUIDADO: isso vai resetar a senha)
-- Descomente apenas se quiser resetar:
/*
-- Primeiro, vamos ver o hash atual
SELECT password FROM users WHERE email = 'fredmazzo@gmail.com';

-- Depois, atualize com este hash para senha "admin123"
UPDATE users 
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';

-- Verificar novamente
SELECT 
  email,
  LENGTH(password) as hash_length,
  LEFT(password, 10) as hash_start
FROM users 
WHERE email = 'fredmazzo@gmail.com';
*/

-- 6. Verificar se o campo está sendo lido corretamente
-- Este SELECT deve retornar exatamente 60 caracteres para um hash bcrypt válido
SELECT 
  email,
  password,
  LENGTH(TRIM(password)) as hash_length_trimmed,
  CASE 
    WHEN LENGTH(TRIM(password)) = 60 THEN 'OK - Hash tem tamanho correto'
    WHEN LENGTH(TRIM(password)) < 60 THEN 'ERRO - Hash muito curto'
    WHEN LENGTH(TRIM(password)) > 60 THEN 'ERRO - Hash muito longo'
    ELSE 'ERRO - Hash inválido'
  END as status_hash
FROM users 
WHERE email = 'fredmazzo@gmail.com';
