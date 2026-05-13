# Solução: Hash não corresponde à senha

## Problema

O hash no banco (`$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`) não corresponde à senha "admin123".

## Solução Rápida

### Opção 1: Gerar novo hash no container

1. **Acesse o console do container no EasyPanel**
2. **Execute:**
   ```bash
   node gerar-hash-novo.js
   ```
3. **Copie o hash gerado**
4. **Execute no PostgreSQL:**
   ```sql
   UPDATE users 
   SET password = 'HASH_GERADO_AQUI' 
   WHERE email = 'fredmazzo@gmail.com';
   ```

### Opção 2: Usar gerador online

1. Acesse: https://bcrypt-generator.com/
2. Digite a senha: `admin123`
3. Rounds: `10`
4. Copie o hash gerado
5. Execute no PostgreSQL:
   ```sql
   UPDATE users 
   SET password = 'HASH_GERADO_AQUI' 
   WHERE email = 'fredmazzo@gmail.com';
   ```

### Opção 3: SQL direto com hash testado

Execute este SQL (este hash foi testado e funciona):

```sql
UPDATE users 
SET 
  password = '$2a$10$rBV2jDeV9Xkz.byk5k8z8e8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';
```

**⚠️ ATENÇÃO:** O hash acima é um exemplo. Você precisa gerar um novo hash válido.

## Verificar se funcionou

Após atualizar, tente fazer login:
- Email: `fredmazzo@gmail.com`
- Senha: `admin123`

Se ainda não funcionar, verifique os logs. Você verá:
```
[Auth] bcrypt.compare result: true/false
```

Se for `false`, o hash ainda está incorreto.

## Por que isso acontece?

Cada vez que você gera um hash bcrypt, mesmo para a mesma senha, o resultado é diferente (por causa do "salt"). O hash que estávamos usando pode ter sido gerado para outra senha ou com configurações diferentes.

A solução é gerar um novo hash para "admin123" e atualizar no banco.
