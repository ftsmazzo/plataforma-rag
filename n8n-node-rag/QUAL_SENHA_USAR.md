# 🔐 Qual Senha Usar para SCP/WinSCP?

## 📋 Tipos de Senha

### 1. Senha do Usuário do Sistema (Mais Comum)

No EasyPanel, geralmente o n8n roda como usuário `node` ou outro usuário não-root.

**Senha**: A senha do usuário `node` (ou o usuário que você configurou)

### 2. Senha Root (Não Recomendado)

A senha root da VPS geralmente **NÃO** é a correta para conectar ao n8n, pois:
- O n8n não roda como root
- O EasyPanel cria usuários específicos

## 🔍 Como Descobrir Qual Usuário e Senha

### Opção 1: Verificar no EasyPanel

1. Acesse o painel do EasyPanel
2. Vá para o serviço **n8n**
3. Procure por:
   - **Environment Variables** → pode ter `USER` ou `N8N_USER`
   - **Settings** → pode mostrar o usuário
   - **Terminal** → quando você abre, mostra qual usuário está logado

### Opção 2: Verificar no Terminal do EasyPanel

No terminal do n8n que você já está usando:

```bash
# Ver qual usuário você está usando
whoami

# Ver informações do usuário
id

# Tentar descobrir se tem senha configurada
# (geralmente no EasyPanel você já está logado, então não precisa de senha para SCP se usar chave SSH)
```

### Opção 3: Usar Chave SSH (Sem Senha)

Se você tem acesso SSH configurado, pode usar chave SSH em vez de senha:

1. **No WinSCP**: Configure para usar "Autenticação por chave pública"
2. **No SCP**: Use a flag `-i` com o caminho da chave

## ✅ Solução Mais Simples

### Se você já está no terminal do EasyPanel:

Você já está logado! Então pode:

1. **Usar o método base64** (sem precisar de senha)
2. **Ou criar os arquivos diretamente** no terminal (sem upload)

### Método Base64 (Recomendado - Sem Senha):

**No seu computador (PowerShell):**

```powershell
# Converter ZIP para base64
$bytes = [System.IO.File]::ReadAllBytes("C:\Users\Frederico Mazzo\rag\n8n-node-rag.zip")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File -Encoding ASCII "C:\Users\Frederico Mazzo\rag\n8n-base64.txt"

# Abrir o arquivo para copiar
notepad "C:\Users\Frederico Mazzo\rag\n8n-base64.txt"
```

**No terminal do n8n (cole o conteúdo do base64.txt):**

```bash
cd ~/.n8n/custom

# Criar arquivo (cole TODO o conteúdo do n8n-base64.txt)
cat > n8n-base64.txt << 'EOF'
[COLE AQUI TODO O CONTEÚDO DO ARQUIVO n8n-base64.txt - será muito longo]
EOF

# Decodificar
base64 -d n8n-base64.txt > n8n-node-rag.zip

# Extrair
unzip n8n-node-rag.zip -d n8n-node-rag

# Limpar
rm n8n-base64.txt n8n-node-rag.zip

# Instalar
cd n8n-node-rag
npm install
npm run build
```

## 🎯 Resumo

- **Senha do WinSCP/SCP**: Geralmente é a senha do usuário `node` (não root)
- **Melhor opção**: Usar base64 (não precisa de senha, você já está logado no terminal)
- **Alternativa**: Se tiver chave SSH, use autenticação por chave

**Recomendo usar o método base64** - é mais simples e não precisa descobrir senha!
