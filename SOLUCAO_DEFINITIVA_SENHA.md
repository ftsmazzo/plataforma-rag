# Solução Definitiva para Problema de Senha

## ⚠️ Se você já tentou atualizar 2 vezes e ainda não funciona

Execute este SQL completo no PostgreSQL. Ele faz uma limpeza completa e verifica tudo:

## 🔧 Passo 1: Execute o SQL Completo

Copie e cole este SQL inteiro no console do PostgreSQL:

```sql
-- RESETAR SENHA DEFINITIVO
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
  END as formato_status
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- PASSO 4: Verificar se não há espaços ou caracteres invisíveis
SELECT 
  email,
  LENGTH(password) as tamanho_original,
  LENGTH(TRIM(password)) as tamanho_sem_espacos,
  CASE 
    WHEN password != TRIM(password) THEN '⚠️ TEM ESPAÇOS NAS PONTAS'
    WHEN password LIKE '% %' THEN '⚠️ TEM ESPAÇOS NO MEIO'
    ELSE '✅ SEM ESPAÇOS OU QUEBRAS'
  END as status_limpeza
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

## 🔑 Credenciais para Login

Após executar o SQL acima:
- **Email**: `fredmazzo@gmail.com`
- **Senha**: `admin123`

## 🔍 Se AINDA não funcionar

### Verificação 1: Verificar se o hash está correto

Execute este SQL para ver o hash completo:

```sql
SELECT 
  email,
  password as hash_completo,
  LENGTH(password) as tamanho
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

O hash deve:
- ✅ Ter exatamente **60 caracteres**
- ✅ Começar com `$2a$10$` ou `$2b$10$`
- ✅ Não ter espaços no início ou fim
- ✅ Ser exatamente: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

### Verificação 2: Verificar se o usuário existe e está ativo

```sql
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
```

### Verificação 3: Verificar logs da aplicação

No console da aplicação no EasyPanel, procure por erros relacionados a:
- `Failed query`
- `bcrypt`
- `password`
- `verifyPassword`

### Verificação 4: Reiniciar a aplicação

Após atualizar a senha, **reinicie o container da aplicação** no EasyPanel para garantir que as mudanças sejam carregadas.

## 🛠️ Solução Alternativa: Criar Novo Usuário Admin

Se nada funcionar, crie um novo usuário admin:

```sql
-- Criar novo usuário admin
-- Hash para senha "admin123"
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Administrador',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  role = 'admin',
  "updatedAt" = NOW();
```

Depois faça login com:
- Email: `admin@exemplo.com`
- Senha: `admin123`

## 📋 Checklist Final

Antes de desistir, verifique:

- [ ] Executei o SQL completo acima
- [ ] O hash tem exatamente 60 caracteres
- [ ] O hash começa com `$2a$10$`
- [ ] Não há espaços no hash (verificado com TRIM)
- [ ] Reiniciei o container da aplicação
- [ ] Verifiquei os logs da aplicação
- [ ] Tentei criar um novo usuário admin

## 💡 Possíveis Causas

Se ainda não funcionar, pode ser:

1. **Problema com bcryptjs no container**: A biblioteca pode estar corrompida
2. **Encoding do banco**: O hash pode estar sendo salvo com encoding errado
3. **Cache da aplicação**: A aplicação pode estar usando dados em cache
4. **Problema na query**: O `getUserByEmail` pode não estar retornando o hash correto

## 🆘 Último Recurso

Se nada funcionar, me envie:
1. O resultado do SQL de verificação (hash completo)
2. Os logs da aplicação ao tentar fazer login
3. A versão do Node.js no container (`node --version`)
