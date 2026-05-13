# 🔧 Solução: Ícone Quebrado e Node Não Aparece como Tool

## 🎯 Problemas Identificados

1. **Ícone quebrado**: O caminho do ícone estava incorreto
2. **Não aparece como Tool**: Precisa de configuração adicional

## ✅ Correções Aplicadas

### 1. Caminho do Ícone Corrigido

- **Antes**: `icon: 'file:nodes/RAG/rag.svg'`
- **Depois**: `icon: 'file:rag.svg'`

O ícone agora está sendo copiado para `dist/nodes/RAG/rag.svg` e o caminho foi corrigido.

### 2. Script de Build Atualizado

Adicionado script para copiar o ícone automaticamente durante o build.

## 🚀 Atualizar no Servidor

No terminal do n8n (EasyPanel):

```bash
# 1. Atualizar código
cd ~/.n8n/custom
rm -rf n8n-node-rag
curl -L https://github.com/ftsmazzo/sistema-rag/archive/refs/heads/main.zip -o temp-rag.zip
unzip temp-rag.zip
cp -r sistema-rag-main/n8n-node-rag .
rm -rf sistema-rag-main temp-rag.zip

# 2. Copiar ícone manualmente (se necessário)
cd n8n-node-rag
cp nodes/RAG/rag.svg dist/nodes/RAG/rag.svg

# 3. Verificar se o ícone existe
ls -la dist/nodes/RAG/rag.svg
# Deve mostrar o arquivo

# 4. Reiniciar o n8n no EasyPanel
```

## 🔧 Para Aparecer como Tool no LangChain Agent

O n8n LangChain Agent pode precisar de configuração adicional. Verifique:

1. **Variável de Ambiente** (no EasyPanel, nas variáveis do n8n):
   ```
   N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
   ```

2. **Reiniciar o n8n** após adicionar a variável

3. **No LangChain Agent**:
   - Clique no "+" ao lado de "Tool"
   - Procure por "FabricaIa-RAG" na lista
   - OU digite "rag" ou "fabrica" na busca

## ✅ Verificar

1. O ícone deve aparecer corretamente
2. O node deve aparecer na busca de Tools do LangChain Agent
3. O nome deve ser "FabricaIa-RAG"

## 🐛 Se ainda não aparecer como Tool

Alguns nodes do n8n precisam estar em workflows específicos para aparecerem como Tools. Tente:

1. Criar um workflow simples com o node "FabricaIa-RAG"
2. Salvar o workflow
3. Depois, no LangChain Agent, o node pode aparecer como opção

Ou verifique se há alguma configuração adicional necessária no n8n para nodes customizados aparecerem como Tools.
