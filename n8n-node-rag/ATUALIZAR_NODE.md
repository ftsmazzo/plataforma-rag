# 🔄 Como Atualizar o Node no n8n

## 🎯 Mudanças Feitas

1. ✅ Renomeado para **"FabricaIa-RAG"**
2. ✅ Novo ícone melhorado (cérebro + lupa)
3. ✅ Corrigido bug de carregamento de bases de conhecimento

## 🚀 Atualizar no Servidor

No terminal do n8n (EasyPanel):

```bash
# 1. Ir para a pasta do node
cd ~/.n8n/custom/n8n-node-rag

# 2. Baixar atualizações
git pull origin master

# OU se não tiver git configurado, baixar ZIP novamente:
cd ~/.n8n/custom
rm -rf n8n-node-rag
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/master.zip -o temp-rag.zip
unzip temp-rag.zip
cp -r sistema-rag-master/n8n-node-rag .
rm -rf sistema-rag-master temp-rag.zip

# 3. Recompilar (se necessário)
cd n8n-node-rag
npm install --production

# 4. Reiniciar o n8n no EasyPanel
```

## ✅ Verificar

1. Reinicie o n8n
2. Crie um novo workflow
3. Procure por **"FabricaIa-RAG"**
4. Teste a operação "Query Knowledge Base"
5. ✅ Deve carregar as bases corretamente agora!

## 🐛 Correções Aplicadas

- **Bug de carregamento**: Agora converte corretamente o ID da base de conhecimento para número
- **Validação**: Adicionada validação para garantir que o ID é válido
- **Resposta da API**: Melhor tratamento de diferentes formatos de resposta
