# Solução Rápida para Problema de Senha

## Problema: Erro de Email ou Senha mesmo após atualizar

Se você atualizou a senha via SQL mas ainda está dando erro, siga estes passos:

## Solução Rápida (5 minutos)

### 1. Execute este SQL no PostgreSQL:

```sql
-- Atualizar senha para "admin123"
UPDATE users 
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';
```

### 2. Faça login com:
- **Email**: `fredmazzo@gmail.com`
- **Senha**: `admin123`

## Se ainda não funcionar:

### Opção A: Usar o script Node.js

Execute no servidor ou localmente (com acesso ao banco):

```bash
node atualizar-senha-admin.js "fredmazzo@gmail.com" "admin123"
```

### Opção B: Testar o login

Para diagnosticar o problema:

```bash
node testar-login.js "fredmazzo@gmail.com" "admin123"
```

Este script vai:
- Verificar se o usuário existe
- Testar se a senha corresponde ao hash
- Mostrar o hash atual no banco
- Gerar um novo hash se necessário

### Opção C: Gerar novo hash

Se quiser usar outra senha:

```bash
# 1. Gerar hash
node gerar-hash-senha.js "sua-senha"

# 2. Copiar o hash gerado

# 3. Atualizar no banco
UPDATE users 
SET password = 'HASH_GERADO_AQUI'
WHERE email = 'fredmazzo@gmail.com';
```

## Verificação Final

Após atualizar, verifique:

```sql
SELECT 
  id, 
  email, 
  name, 
  role,
  LEFT(password, 30) || '...' as hash_preview
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

O hash deve começar com `$2a$10$` (bcrypt com 10 rounds).

## Importante

- ✅ O hash DEVE começar com `$2a$10$` ou `$2b$10$`
- ✅ O hash DEVE ter 60 caracteres
- ✅ Use o script `testar-login.js` para verificar se está funcionando
- ⚠️ Se o hash não corresponder, gere um novo com `gerar-hash-senha.js`
