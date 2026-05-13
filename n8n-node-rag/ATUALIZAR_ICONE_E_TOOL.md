# 🔧 Atualizar: Corrigir Ícone e Aparecer como Tool

## 🎯 Problemas

1. ✅ **Ícone quebrado** - Caminho corrigido
2. ⚠️ **Não aparece como Tool** - Precisa de configuração

## ✅ Correções Aplicadas

1. **Caminho do ícone**: Mudado de `file:nodes/RAG/rag.svg` para `file:rag.svg`
2. **Ícone copiado**: Agora está em `dist/nodes/RAG/rag.svg`
3. **Script de build**: Atualizado para copiar ícone automaticamente

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

# 2. Copiar ícone (IMPORTANTE!)
cd n8n-node-rag
cp nodes/RAG/rag.svg dist/nodes/RAG/rag.svg

# 3. Verificar
ls -la dist/nodes/RAG/
# Deve mostrar: RAG.node.js, RAG.node.d.ts, rag.svg

# 4. Reiniciar o n8n no EasyPanel
```

## 🔧 Para Aparecer como Tool no LangChain Agent

### Opção 1: Variável de Ambiente (Recomendado)

No EasyPanel, adicione esta variável de ambiente ao serviço n8n:

```
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

Depois, **reinicie o n8n**.

### Opção 2: Verificar se o Node Está Configurado

O node já está no grupo `['transform', 'ai']`, o que deve fazer aparecer como Tool.

### Opção 3: Usar como Sub-workflow

Alguns nodes só aparecem como Tools se estiverem em um sub-workflow. Tente:

1. Criar um workflow separado com o node "FabricaIa-RAG"
2. Salvar como template
3. Usar esse workflow como Tool no LangChain Agent

## ✅ Verificar

1. **Ícone**: Deve aparecer corretamente (não quebrado)
2. **Nome**: "FabricaIa-RAG"
3. **Tool**: Deve aparecer na lista de Tools do LangChain Agent

## 🐛 Se ainda não aparecer como Tool

O n8n pode ter limitações sobre quais nodes aparecem como Tools. Verifique:

- O node está compilado? (`ls dist/nodes/RAG/`)
- O ícone existe? (`ls dist/nodes/RAG/rag.svg`)
- A variável de ambiente foi adicionada?
- O n8n foi reiniciado?

Se ainda não funcionar, pode ser necessário usar o node como parte de um sub-workflow ou aguardar atualizações do n8n que melhorem o suporte a Tools customizados.
