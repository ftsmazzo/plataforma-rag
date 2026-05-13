# 🔍 Como Encontrar Onde o n8n Está Instalado

## Métodos para descobrir a localização do n8n

### 1. Verificar Variáveis de Ambiente

```bash
env | grep -i n8n
echo $N8N_USER_FOLDER
echo $N8N_HOME
```

### 2. Verificar Processo em Execução

```bash
# Ver processos do n8n
ps aux | grep n8n

# Ver arquivos abertos pelo n8n
lsof -p $(pgrep -f n8n) 2>/dev/null | grep -i n8n
```

### 3. Verificar Locais Comuns

```bash
# Home do usuário
ls -la ~/.n8n/

# Diretórios do sistema
ls -la /opt/n8n/
ls -la /usr/local/n8n/
ls -la /var/lib/n8n/

# Docker
docker ps | grep n8n
docker inspect <container-id> | grep -i n8n
```

### 4. Verificar Configuração do n8n

Se você tem acesso ao n8n via web:

1. Acesse: `http://seu-n8n:5678/settings`
2. Procure por "User Folder" ou "Data Directory"
3. Essa é a pasta onde você deve instalar o node

### 5. Verificar Logs

```bash
# Ver logs do n8n (pode mostrar o caminho)
docker logs <container-n8n> 2>&1 | grep -i "user folder\|data directory\|custom"

# Ou se for systemd
journalctl -u n8n | grep -i "user folder\|data directory\|custom"
```

### 6. Verificar package.json do n8n

```bash
# Se o n8n foi instalado via npm
npm list -g n8n

# Ver onde está
which n8n
```

## 📍 Depois de Encontrar

Quando descobrir o caminho, use:

```bash
# Exemplo: se estiver em /data/n8n
mkdir -p /data/n8n/custom
cd /data/n8n/custom

# Seguir instalação manual
```
