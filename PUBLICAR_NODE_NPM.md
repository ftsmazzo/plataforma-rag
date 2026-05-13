# 📦 Como Publicar o Node no npm para Instalação Fácil

## 🎯 Objetivo

Publicar o node customizado no npm para que usuários possam instalar com um simples:
```bash
npm install @rag-system/n8n-nodes-rag
```

## 📋 Pré-requisitos

1. Conta no npm (crie em https://www.npmjs.com/signup)
2. Node.js e npm instalados
3. Acesso ao terminal

## 🚀 Passo a Passo

### 1. Preparar o Pacote

```bash
cd n8n-node-rag

# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Verificar se compilou corretamente
ls -la dist/
# Deve ter:
# - dist/nodes/RAG/RAG.node.js
# - dist/credentials/RAGApi.credentials.js
```

### 2. Testar Localmente (Opcional)

```bash
# Criar link local para testar
npm link

# Em outro terminal, no diretório do n8n
cd /path/to/n8n
npm link @rag-system/n8n-nodes-rag

# Reiniciar n8n e testar
```

### 3. Fazer Login no npm

```bash
npm login
# Digite:
# - Username: seu-usuario-npm
# - Password: sua-senha
# - Email: seu-email
```

### 4. Verificar Versão

Edite `package.json` e defina a versão inicial:
```json
{
  "version": "1.0.0"
}
```

### 5. Publicar

```bash
# Verificar se está tudo OK
npm run build

# Publicar
npm publish --access public
```

**Nota**: A primeira vez pode pedir autenticação 2FA se você habilitou.

### 6. Verificar Publicação

Acesse: `https://www.npmjs.com/package/@rag-system/n8n-nodes-rag`

## 🔄 Atualizações Futuras

Quando fizer mudanças:

```bash
# 1. Atualize a versão no package.json (semantic versioning)
# - patch: 1.0.0 → 1.0.1 (correções)
# - minor: 1.0.0 → 1.1.0 (novas features)
# - major: 1.0.0 → 2.0.0 (breaking changes)

# 2. Compile
npm run build

# 3. Publique
npm publish --access public
```

## 📝 Alternativa: Instalação via GitHub (Sem npm publish)

Se não quiser publicar no npm ainda, usuários podem instalar diretamente do GitHub:

```bash
npm install https://github.com/ftsmazzo/sistema-rag.git#master:n8n-node-rag
```

**Vantagem**: Não precisa publicar no npm
**Desvantagem**: URL mais longa, menos "oficial"

## 🎯 Após Publicar

Usuários podem instalar com:

```bash
npm install @rag-system/n8n-nodes-rag
```

E o node aparecerá automaticamente no n8n após reiniciar!

## ✅ Checklist Antes de Publicar

- [ ] Código compilado (`npm run build`)
- [ ] Sem erros de lint (`npm run lint`)
- [ ] README.md atualizado
- [ ] Versão correta no package.json
- [ ] Testado localmente (se possível)
- [ ] .npmignore configurado (não publicar arquivos desnecessários)

## 🐛 Troubleshooting

### Erro: "Package name already exists"
- Escolha outro nome no package.json
- Ou use um escopo diferente: `@seu-usuario/n8n-nodes-rag`

### Erro: "You must verify your email"
- Verifique seu email no npm
- Acesse o link de verificação

### Erro: "Invalid package name"
- Nome deve ser lowercase
- Pode usar hífens, mas não espaços
- Não pode começar com ponto ou underscore

### Node não aparece após instalar
- Verifique se compilou: `ls dist/`
- Verifique logs do n8n
- Certifique-se de ter reiniciado o n8n
