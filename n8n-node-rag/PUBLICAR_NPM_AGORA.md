# 📦 Publicar no npm - Instalação Simples

## 🎯 Objetivo

Publicar o node no npm para que qualquer um possa instalar com:
```bash
npm install @rag-system/n8n-nodes-rag
```

## ✅ Pré-requisitos

1. Conta no npm (crie em https://www.npmjs.com/signup)
2. Node.js instalado no seu computador
3. Acesso ao terminal

## 🚀 Passo a Passo para Publicar

### 1. Preparar Localmente

No seu computador:

```bash
# 1. Ir para a pasta do node
cd n8n-node-rag

# 2. Instalar dependências
npm install

# 3. Compilar
npm run build

# 4. Verificar se compilou
ls -la dist/nodes/RAG/
# Deve ter: RAG.node.js, RAG.node.d.ts, rag.svg
```

### 2. Fazer Login no npm

```bash
npm login
# Digite:
# - Username: seu-usuario-npm
# - Password: sua-senha
# - Email: seu-email
```

### 3. Verificar Versão

O `package.json` já tem `"version": "1.0.0"`. Se quiser atualizar:

```bash
npm version patch  # 1.0.0 -> 1.0.1
# OU
npm version minor  # 1.0.0 -> 1.1.0
# OU
npm version major  # 1.0.0 -> 2.0.0
```

### 4. Publicar

```bash
npm publish --access public
```

**Nota**: Se der erro de nome já existente, mude o nome no `package.json` para algo único.

### 5. Verificar Publicação

Acesse: `https://www.npmjs.com/package/@rag-system/n8n-nodes-rag`

## 🎉 Depois de Publicar

### Instalação Simples (Para Qualquer Um)

No servidor n8n (EasyPanel ou qualquer lugar):

```bash
cd ~/.n8n/custom
npm install @rag-system/n8n-nodes-rag
```

**Pronto!** Não precisa mais:
- ❌ Clonar repositório
- ❌ Compilar
- ❌ Copiar arquivos
- ❌ Configurar nada

Só instalar e reiniciar o n8n!

## 🔄 Atualizações Futuras

Quando fizer mudanças:

```bash
# 1. Atualizar versão
npm version patch  # ou minor, ou major

# 2. Compilar
npm run build

# 3. Publicar
npm publish --access public
```

## ✅ Checklist Antes de Publicar

- [ ] Código compilado (`npm run build`)
- [ ] Ícone existe em `dist/nodes/RAG/rag.svg`
- [ ] Versão correta no `package.json`
- [ ] README.md atualizado
- [ ] Testado localmente (se possível)
- [ ] Login no npm feito (`npm login`)

## 🐛 Troubleshooting

### Erro: "Package name already exists"
- Escolha outro nome no `package.json`
- Exemplo: `@seu-usuario/n8n-nodes-rag`

### Erro: "You must verify your email"
- Verifique seu email no npm
- Acesse o link de verificação

### Erro: "Invalid package name"
- Nome deve ser lowercase
- Pode usar hífens, mas não espaços
- Não pode começar com ponto ou underscore
