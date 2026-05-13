# Solução para Problema de Login

## Erro: "Failed query: select ... from users where email = $1"

Este erro indica que a query está sendo executada, mas pode estar falhando por alguns motivos:

### Possíveis Causas:

1. **Usuário não foi criado** - O SQL pode não ter sido executado corretamente
2. **Problema de conexão com banco** - A aplicação pode não estar conseguindo conectar ao PostgreSQL
3. **Tabela não existe** - As migrações podem não ter sido executadas

## Solução Passo a Passo:

### 1. Verificar se o usuário existe

Execute o script `verificar-usuario.sql` no PostgreSQL:

```bash
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f verificar-usuario.sql
```

Ou execute diretamente no psql:

```sql
SELECT id, email, name, role, "organizationId" 
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

### 2. Se o usuário não existir, criar novamente

Execute este SQL completo:

```sql
-- Criar organização se não existir
INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES ('Organização Padrão', 'default', 'Organização padrão', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Criar ou atualizar usuário
WITH org AS (SELECT id FROM organizations WHERE slug = 'default' LIMIT 1)
INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
SELECT 
  'fredmazzo@gmail.com',
  '$2a$10$slLivZB6fK4fztvk3rJaQOFhJ7RfS7lCqljudIChyNoz5QlvgigBG',
  'Frederico Mazzo',
  'admin',
  org.id,
  NOW(),
  NOW(),
  NOW()
FROM org
ON CONFLICT (email) DO UPDATE
SET 
  role = 'admin',
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  "updatedAt" = NOW();
```

### 3. Verificar conexão do banco na aplicação

Verifique se a variável `DATABASE_URL` está configurada corretamente no EasyPanel:

```
DATABASE_URL=postgresql://usuario:senha@host:porta/banco?sslmode=disable
```

### 4. Verificar logs da aplicação

No EasyPanel, verifique os logs do container para ver se há erros de conexão:

```bash
# No console do EasyPanel ou via SSH
docker logs nome-do-container
```

### 5. Testar conexão manualmente

Se possível, teste a conexão do container com o banco:

```bash
# Dentro do container
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## Verificação Rápida:

Execute este SQL para verificar tudo de uma vez:

```sql
-- Verificar tabela
SELECT COUNT(*) as total_usuarios FROM users;

-- Verificar usuário específico
SELECT id, email, name, role, "organizationId" 
FROM users 
WHERE email = 'fredmazzo@gmail.com';

-- Verificar organização
SELECT id, name, slug FROM organizations WHERE slug = 'default';
```

## Se Nada Funcionar:

1. **Verifique se as migrações foram executadas:**
   - O script `init-db.sh` deve ter executado `drizzle-kit migrate`
   - Verifique os logs do container durante o startup

2. **Recrie o usuário usando o script Node.js:**
   ```bash
   ADMIN_EMAIL="fredmazzo@gmail.com" ADMIN_PASSWORD="sua-senha" node create-admin.js
   ```

3. **Verifique permissões do banco:**
   - O usuário do PostgreSQL precisa ter permissão para SELECT, INSERT, UPDATE na tabela `users`
