# Como Executar os Scripts de Teste

## Opção 1: Executar dentro do Container Docker (EasyPanel)

### Passo a Passo:

1. **Acesse o console do container no EasyPanel:**
   - Vá para o projeto no EasyPanel
   - Clique no container da aplicação
   - Procure por "Console" ou "Terminal" ou "Exec"

2. **Execute o script:**
   ```bash
   # Testar login
   node testar-login.js "fredmazzo@gmail.com" "sua-senha"
   
   # Atualizar senha
   node atualizar-senha-admin.js "fredmazzo@gmail.com" "nova-senha"
   
   # Gerar hash
   node gerar-hash-senha.js "sua-senha"
   ```

### Se o arquivo não estiver no container:

Os scripts podem não estar no container. Nesse caso, você pode:

**A) Copiar o script para o container:**
```bash
# Dentro do console do container
cat > /app/testar-login.js << 'EOF'
[cole o conteúdo do arquivo testar-login.js aqui]
EOF

# Depois execute
node /app/testar-login.js "fredmazzo@gmail.com" "sua-senha"
```

**B) Ou executar diretamente via SQL (mais fácil):**

## Opção 2: Executar SQL Direto (Mais Fácil)

### No Console do PostgreSQL (EasyPanel):

1. **Acesse o console do PostgreSQL no EasyPanel**
2. **Execute este SQL para atualizar a senha:**

```sql
-- Primeiro, gere o hash (use um gerador online: https://bcrypt-generator.com/)
-- Ou use este hash para senha "admin123":
UPDATE users 
SET 
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';

-- Verificar
SELECT id, email, name, role FROM users WHERE email = 'fredmazzo@gmail.com';
```

3. **Faça login com:**
   - Email: `fredmazzo@gmail.com`
   - Senha: `admin123`

## Opção 3: Executar Localmente (se tiver acesso ao banco)

Se você tem acesso ao banco de dados do seu computador:

```bash
# 1. Configure a variável DATABASE_URL
export DATABASE_URL="postgresql://usuario:senha@host:porta/banco"

# 2. Execute o script
node testar-login.js "fredmazzo@gmail.com" "sua-senha"
```

## Opção 4: Via SSH no Servidor (se tiver acesso)

Se você tem acesso SSH ao servidor:

```bash
# 1. Conecte-se ao servidor
ssh usuario@seu-servidor

# 2. Entre no diretório do projeto (se estiver lá)
cd /caminho/do/projeto

# 3. Execute o script
node testar-login.js "fredmazzo@gmail.com" "sua-senha"
```

## Solução Mais Rápida: SQL Direto

A forma mais rápida é usar SQL diretamente no console do PostgreSQL:

### 1. Acesse o PostgreSQL no EasyPanel

### 2. Execute este SQL completo:

```sql
-- Atualizar senha para "admin123"
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
  LEFT(password, 30) || '...' as hash_preview
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

### 3. Faça login:
- Email: `fredmazzo@gmail.com`
- Senha: `admin123`

## Gerar Hash de Outra Senha

Se quiser usar outra senha, use um gerador online:

1. Acesse: https://bcrypt-generator.com/
2. Digite sua senha
3. Rounds: 10
4. Copie o hash gerado
5. Use no SQL acima

## Verificar se Está Funcionando

Após atualizar, verifique no banco:

```sql
SELECT 
  id, 
  email, 
  name, 
  role,
  LENGTH(password) as hash_length,
  LEFT(password, 10) as hash_start
FROM users 
WHERE email = 'fredmazzo@gmail.com';
```

O hash deve:
- Ter 60 caracteres
- Começar com `$2a$10$` ou `$2b$10$`
