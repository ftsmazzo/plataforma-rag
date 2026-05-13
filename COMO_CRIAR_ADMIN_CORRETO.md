# Como Criar Admin Corretamente

## Problema: Erro de Email ou Senha

Se você está recebendo erro de "email ou senha inválidos", provavelmente o hash da senha no banco não corresponde à senha que você está digitando.

## Solução Passo a Passo:

### 1. Gerar o Hash da Senha

**Opção A: Usando o script Node.js (Recomendado)**

```bash
# Execute no servidor ou localmente
node gerar-hash-senha.js "sua-senha-aqui"
```

Isso vai gerar um hash como:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Opção B: Usando gerador online**

1. Acesse: https://bcrypt-generator.com/
2. Digite sua senha
3. Rounds: 10
4. Copie o hash gerado

### 2. Criar o Usuário no Banco

Execute este SQL no PostgreSQL (substitua os valores):

```sql
-- Criar organização se não existir
INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES ('Organização Padrão', 'default', 'Organização padrão', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Criar admin (SUBSTITUA os valores)
WITH org AS (SELECT id FROM organizations WHERE slug = 'default' LIMIT 1)
INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
SELECT 
  'seu-email@exemplo.com',           -- SEU EMAIL AQUI
  '$2a$10$HASH_GERADO_AQUI',         -- HASH GERADO NO PASSO 1
  'Seu Nome',
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

### 3. Verificar se Funcionou

```sql
SELECT id, email, name, role FROM users WHERE email = 'seu-email@exemplo.com';
```

### 4. Testar o Login

Tente fazer login com:
- **Email**: o email que você usou no SQL
- **Senha**: a senha que você usou para gerar o hash

## Testar Hash Existente

Se você já tem um hash e quer testar se corresponde a uma senha:

```bash
node testar-senha.js "senha" "hash"
```

## Exemplo Completo

```bash
# 1. Gerar hash para senha "admin123"
node gerar-hash-senha.js "admin123"

# Output:
# Senha: admin123
# Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

# 2. Usar esse hash no SQL
# (copie o hash e cole no SQL acima)

# 3. Fazer login com:
# Email: seu-email@exemplo.com
# Senha: admin123
```

## Importante

- ⚠️ **O hash DEVE ser gerado com a mesma senha que você vai usar no login**
- ⚠️ **Cada senha gera um hash diferente** (mesmo que a senha seja a mesma, o hash pode variar)
- ⚠️ **Use o hash gerado no momento da criação do usuário**
