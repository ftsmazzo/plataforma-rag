# Como Criar um Usuário Admin

Você perdeu o usuário admin? Aqui estão duas formas de criar um novo:

## Opção 1: Usando o Script Node.js (Recomendado)

1. **Configure as variáveis de ambiente** (opcional):
   ```bash
   export ADMIN_EMAIL="seu-email@exemplo.com"
   export ADMIN_PASSWORD="sua-senha-segura"
   export ADMIN_NAME="Seu Nome"
   ```

2. **Execute o script**:
   ```bash
   node create-admin.js
   ```

   Ou com variáveis inline:
   ```bash
   ADMIN_EMAIL="admin@exemplo.com" ADMIN_PASSWORD="senha123" node create-admin.js
   ```

## Opção 2: Usando SQL Diretamente

### Passo 1: Gerar o Hash da Senha

Você precisa gerar o hash bcrypt da senha. Você pode:

**Opção A: Usar Node.js**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua-senha', 10).then(h => console.log(h))"
```

**Opção B: Usar um gerador online**
- Acesse: https://bcrypt-generator.com/
- Digite sua senha
- Copie o hash gerado

### Passo 2: Executar o SQL

1. Conecte-se ao banco PostgreSQL:
   ```bash
   psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO
   ```

2. Execute o SQL (substitua os valores):
   ```sql
   -- Criar organização padrão se não existir
   INSERT INTO organizations (name, slug, description, "isActive", "createdAt", "updatedAt")
   VALUES ('Organização Padrão', 'default', 'Organização padrão', true, NOW(), NOW())
   ON CONFLICT DO NOTHING;

   -- Obter ID da organização
   WITH org AS (SELECT id FROM organizations WHERE slug = 'default' LIMIT 1)
   INSERT INTO users (email, password, name, role, "organizationId", "createdAt", "updatedAt", "lastSignedIn")
   SELECT 
     'admin@exemplo.com',  -- SUBSTITUA pelo seu email
     '$2a$10$SEU_HASH_AQUI',  -- SUBSTITUA pelo hash da senha gerado
     'Administrador',
     'admin',  -- IMPORTANTE: deve ser 'admin', não outro valor
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

## Opção 3: Via Interface Web (Se já tiver um usuário)

Se você já tem um usuário comum, pode:

1. Fazer login com esse usuário
2. Conectar-se ao banco e atualizar o role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
   ```

## Verificar se Funcionou

Após criar o admin, você pode verificar:

```sql
SELECT id, email, name, role, "organizationId" FROM users WHERE role = 'admin';
```

## Importante

- ⚠️ **Altere a senha após o primeiro login!**
- ⚠️ **Mantenha as credenciais seguras!**
- ⚠️ **Não compartilhe o acesso admin com usuários não autorizados!**
