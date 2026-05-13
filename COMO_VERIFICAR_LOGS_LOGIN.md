# Como Verificar os Logs de Login

## 🔍 O que foi adicionado

Adicionei logs detalhados no código de login para identificar o problema. Agora você verá informações sobre:
- Se o usuário foi encontrado
- O tamanho e início do hash da senha
- O resultado da verificação de senha
- Detalhes do hash (início, fim, tamanho)

## 📋 Passos para Diagnosticar

### 1. Faça o Deploy da Nova Versão

No EasyPanel:
1. Vá para o projeto
2. Clique em "Redeploy" ou "Rebuild" para aplicar as mudanças
3. Aguarde o build e deploy completarem

### 2. Atualize a Senha no Banco (se necessário)

Execute este SQL no PostgreSQL:

```sql
UPDATE users 
SET 
  password = TRIM('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
  "updatedAt" = NOW()
WHERE email = 'fredmazzo@gmail.com';
```

### 3. Tente Fazer Login

Tente fazer login com:
- Email: `fredmazzo@gmail.com`
- Senha: `admin123`

### 4. Verifique os Logs no EasyPanel

No EasyPanel, vá para:
1. **Logs** do container da aplicação
2. Procure por linhas que começam com `[Login]` ou `[Auth]`

Você verá algo como:

```
[Login] User found: { id: 1, email: 'fredmazzo@gmail.com', passwordHashLength: 60, ... }
[Login] Verifying password...
[Auth] Verifying password: { passwordLength: 8, hashLength: 60, ... }
[Auth] bcrypt.compare result: true/false
[Login] Password verification result: true/false
```

## 🔎 O que Procurar nos Logs

### Se aparecer `[Login] User not found:`
- O usuário não existe no banco
- Verifique se o email está correto
- Execute: `SELECT * FROM users WHERE email = 'fredmazzo@gmail.com';`

### Se aparecer `passwordHashLength: 0` ou `passwordHashStart: "null"`
- O hash não está sendo lido do banco
- Pode ser problema na query ou no schema
- Verifique se o campo `password` existe na tabela

### Se aparecer `hashLength: 59` ou diferente de `60`
- O hash está sendo truncado ou corrompido
- Pode haver problema de encoding ou tipo de dados
- Execute: `SELECT LENGTH(password) FROM users WHERE email = 'fredmazzo@gmail.com';`

### Se aparecer `bcrypt.compare result: false`
- O hash não corresponde à senha
- Possíveis causas:
  - Hash incorreto no banco
  - Hash com espaços ou caracteres invisíveis
  - Problema com bcryptjs

### Se aparecer `[Auth] Error verifying password:`
- Erro ao executar bcrypt.compare
- Pode ser problema com a biblioteca bcryptjs
- Verifique se bcryptjs está instalado corretamente

## 📊 Exemplo de Logs Corretos

Se tudo estiver funcionando, você verá:

```
[Login] User found: {
  id: 1,
  email: 'fredmazzo@gmail.com',
  passwordHashLength: 60,
  passwordHashStart: '$2a$10$N9qo8uLOick',
  passwordHashType: 'string'
}
[Login] Verifying password...
[Auth] Verifying password: {
  passwordLength: 8,
  hashLength: 60,
  trimmedHashLength: 60,
  hashStart: '$2a$10$N9',
  hashEnd: 'JZdL17lhWy'
}
[Auth] bcrypt.compare result: true
[Login] Password verification result: true
```

## 🛠️ Se os Logs Mostrarem Problema

### Problema: Hash com tamanho errado
```sql
-- Verificar e corrigir
SELECT LENGTH(password), password FROM users WHERE email = 'fredmazzo@gmail.com';
UPDATE users SET password = TRIM('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy') WHERE email = 'fredmazzo@gmail.com';
```

### Problema: Hash não está sendo lido
- Verifique se a tabela `users` tem o campo `password`
- Verifique se o Drizzle está mapeando corretamente
- Execute: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';`

### Problema: bcrypt.compare sempre retorna false
- Pode ser problema com a biblioteca
- Tente reinstalar: `npm install bcryptjs`
- Verifique se há múltiplas versões do bcrypt instaladas

## 📝 Envie os Logs

Após tentar fazer login, copie e envie:
1. Todas as linhas que começam com `[Login]`
2. Todas as linhas que começam com `[Auth]`
3. Qualquer erro que aparecer

Isso vai ajudar a identificar exatamente onde está o problema!
