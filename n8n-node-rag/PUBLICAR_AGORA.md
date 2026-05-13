# 🚀 Publicar no npm - Passo a Passo

## ⚠️ Problema Atual

O pacote ainda não foi publicado. Siga estes passos:

## ✅ Passo 1: Verificar Login

```bash
npm whoami
```

Deve mostrar: `fabricaia`

## ✅ Passo 2: Fazer Login (se necessário)

```bash
npm login
```

- Username: `fabricaia`
- Password: sua senha
- OTP: código do email

## ✅ Passo 3: Verificar Token

Se o login não funcionar, crie um token:

1. Acesse: https://www.npmjs.com/settings/fabricaia/tokens
2. Clique em "Generate New Token"
3. Escolha "Granular Access Token"
4. Configure:
   - **Token name**: `n8n-publish`
   - **Type**: `Publish`
   - **Packages**: `@fabricaia/*`
   - **Bypass 2FA**: Marque se disponível
5. Copie o token
6. Use:
   ```bash
   npm config set //registry.npmjs.org/:_authToken SEU_TOKEN_AQUI
   ```

## ✅ Passo 4: Publicar

```bash
npm publish --access public
```

## ✅ Passo 5: Verificar

Acesse: https://www.npmjs.com/package/@fabricaia/n8n-nodes-rag

## 🎉 Depois de Publicar

Instalar com:
```bash
cd ~/.n8n/custom
npm install @fabricaia/n8n-nodes-rag
```
