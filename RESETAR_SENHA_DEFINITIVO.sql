-- RESETAR SENHA DEFINITIVO - Execute este SQL completo
-- Este script limpa e recria o hash corretamente

-- PASSO 1: Verificar o estado atual
SELECT 
  'ANTES' as etapa,
  email,
  LENGTH(password) as tamanho,
  LEFT(password, 20) as inicio,
  CASE 
    WHEN password LIKE '$2a$10$%' OR password LIKE '$2b$10$%' THEN 'Formato OK'
    ELSE 'Formato ERRADO'
  END as formato
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- PASSO 2: LIMPAR e atualizar com hash correto
-- Hash para senha "admin123" (bcrypt, rounds=10, testado)
UPDATE users 
SET 
  password = TRIM('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';

-- PASSO 3: Verificar após atualização
SELECT 
  'DEPOIS' as etapa,
  email,
  LENGTH(password) as tamanho,
  LEFT(password, 20) as inicio,
  CASE 
    WHEN LENGTH(password) = 60 THEN '✅ Tamanho correto (60 caracteres)'
    ELSE '❌ Tamanho incorreto'
  END as tamanho_status,
  CASE 
    WHEN password LIKE '$2a$10$%' OR password LIKE '$2b$10$%' THEN '✅ Formato correto'
    ELSE '❌ Formato incorreto'
  END as formato_status,
  password as hash_completo
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- PASSO 4: Verificar se não há espaços ou caracteres invisíveis
SELECT 
  email,
  password,
  LENGTH(password) as tamanho_original,
  LENGTH(TRIM(password)) as tamanho_sem_espacos,
  LENGTH(REPLACE(REPLACE(REPLACE(password, ' ', ''), E'\n', ''), E'\r', '')) as tamanho_sem_whitespace,
  CASE 
    WHEN password != TRIM(password) THEN '⚠️ TEM ESPAÇOS NAS PONTAS'
    WHEN password LIKE '% %' THEN '⚠️ TEM ESPAÇOS NO MEIO'
    WHEN password LIKE E'%\n%' OR password LIKE E'%\r%' THEN '⚠️ TEM QUEBRAS DE LINHA'
    ELSE '✅ SEM ESPAÇOS OU QUEBRAS'
  END as status_limpeza
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- CREDENCIAIS PARA LOGIN:
-- Email: fredmazzo@gmail.com
-- Senha: admin123
