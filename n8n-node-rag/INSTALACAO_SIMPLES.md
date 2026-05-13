# ⚡ Instalação Mais Simples - Sem Upload

## 🎯 Solução: Usar SCP do seu computador Windows

### No seu computador (PowerShell):

```powershell
# 1. Conectar via SCP e copiar a pasta
# Substitua 'seu-servidor' pelo IP ou domínio do EasyPanel
scp -r "C:\Users\Frederico Mazzo\rag\n8n-node-rag" node@seu-servidor:/home/node/.n8n/custom/

# Se pedir senha, digite a senha do servidor
# Se usar chave SSH, pode não pedir senha
```

### No servidor (depois do SCP):

```bash
cd ~/.n8n/custom/n8n-node-rag
npm install
npm run build
ls dist/
```

## 🔄 Alternativa: Usar WinSCP (Interface Gráfica)

Se você não tem SCP no PowerShell:

1. **Baixe WinSCP**: https://winscp.net/
2. **Conecte ao servidor**:
   - Host: IP ou domínio do EasyPanel
   - Usuário: `node` (ou o usuário do n8n)
   - Senha: senha do servidor
3. **Navegue até**: `/home/node/.n8n/custom/`
4. **Arraste a pasta** `n8n-node-rag` do seu computador para o servidor
5. **No terminal do servidor**:
   ```bash
   cd ~/.n8n/custom/n8n-node-rag
   npm install
   npm run build
   ```

## 📝 Alternativa: Criar Arquivos via Terminal (Mais Trabalhoso)

Se não conseguir usar SCP, posso criar um script que você copia e cola no terminal para criar cada arquivo individualmente. Mas será muito longo.

**Qual método você prefere tentar primeiro?**
