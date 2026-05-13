# Documentação da API - RAG Knowledge Base

## Visão Geral

Esta API fornece acesso completo ao sistema RAG (Retrieval-Augmented Generation) para gerenciamento de documentos, busca semântica e chat com IA. A API é construída com tRPC e oferece type-safety completo.

**Base URL**: `https://seu-dominio.com/api/trpc`

**Autenticação**: Todas as rotas protegidas requerem autenticação via cookie de sessão OAuth.

---

## Índice

1. [Autenticação](#autenticação)
2. [Documentos](#documentos)
3. [Busca Semântica](#busca-semântica)
4. [Chat com IA](#chat-com-ia)
5. [Versionamento](#versionamento)
6. [Feedback](#feedback)
7. [Analytics](#analytics)
8. [Administração](#administração)
9. [Integração com N8N](#integração-com-n8n)

---

## Autenticação

### Login

**Endpoint**: `GET /api/oauth/login`

Redireciona para o portal de autenticação OAuth.

**Resposta**: Redirecionamento HTTP

---

### Obter Usuário Atual

**Endpoint**: `auth.me`

**Método**: Query

**Autenticação**: Opcional

**Resposta**:
```json
{
  "id": 1,
  "openId": "user-open-id",
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "user",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Logout

**Endpoint**: `auth.logout`

**Método**: Mutation

**Autenticação**: Requerida

**Resposta**:
```json
{
  "success": true
}
```

---

## Documentos

### Upload de Documento

**Endpoint**: `documents.upload`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  filename: string;        // Nome do arquivo
  fileType: string;        // Tipo: pdf, xlsx, csv, png, jpg, txt
  fileSize: number;        // Tamanho em bytes
  base64Data: string;      // Arquivo codificado em base64
  mimeType: string;        // MIME type do arquivo
}
```

**Resposta**:
```json
{
  "id": 123,
  "filename": "documento.pdf",
  "status": "processing",
  "s3Url": "https://s3.amazonaws.com/..."
}
```

**Exemplo de Uso (JavaScript)**:
```javascript
const file = document.getElementById('fileInput').files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64Data = reader.result.split(',')[1];
  
  const result = await trpc.documents.upload.mutate({
    filename: file.name,
    fileType: file.name.split('.').pop(),
    fileSize: file.size,
    base64Data: base64Data,
    mimeType: file.type
  });
  
  console.log('Document uploaded:', result);
};

reader.readAsDataURL(file);
```

---

### Listar Documentos do Usuário

**Endpoint**: `documents.list`

**Método**: Query

**Autenticação**: Requerida

**Resposta**:
```json
[
  {
    "id": 123,
    "filename": "documento.pdf",
    "originalFilename": "Meu Documento.pdf",
    "fileType": "pdf",
    "fileSize": 1024000,
    "status": "completed",
    "totalChunks": 15,
    "tags": "contrato,legal",
    "description": "Contrato de prestação de serviços",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Obter Detalhes de Documento

**Endpoint**: `documents.getById`

**Método**: Query

**Autenticação**: Requerida

**Input**:
```typescript
{
  id: number;  // ID do documento
}
```

**Resposta**:
```json
{
  "id": 123,
  "filename": "documento.pdf",
  "status": "completed",
  "s3Url": "https://s3.amazonaws.com/...",
  "totalChunks": 15,
  "tags": "contrato,legal",
  "description": "Contrato de prestação de serviços"
}
```

---

### Atualizar Metadados

**Endpoint**: `documents.updateMetadata`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  documentId: number;
  tags?: string;         // Tags separadas por vírgula
  description?: string;  // Descrição do documento
}
```

**Resposta**:
```json
{
  "success": true
}
```

---

### Gerar Tags Automaticamente

**Endpoint**: `documents.generateTags`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  documentId: number;
}
```

**Resposta**:
```json
{
  "tags": ["contrato", "legal", "prestação de serviços", "cláusulas"]
}
```

---

### Deletar Documento

**Endpoint**: `documents.delete`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  documentId: number;
}
```

**Resposta**:
```json
{
  "success": true
}
```

---

## Busca Semântica

### Buscar Documentos

**Endpoint**: `documents.search`

**Método**: Query

**Autenticação**: Requerida

**Input**:
```typescript
{
  query: string;      // Texto da busca
  topK?: number;      // Número de resultados (padrão: 5)
}
```

**Resposta**:
```json
{
  "results": [
    {
      "chunkId": 456,
      "documentId": 123,
      "documentName": "documento.pdf",
      "content": "Texto relevante encontrado...",
      "similarity": 0.92,
      "metadata": {
        "chunkIndex": 3,
        "page": 2
      }
    }
  ]
}
```

**Exemplo de Uso (N8N)**:
```json
{
  "method": "POST",
  "url": "https://seu-dominio.com/api/trpc/documents.search",
  "headers": {
    "Content-Type": "application/json",
    "Cookie": "session=..."
  },
  "body": {
    "query": "cláusulas de pagamento"
  }
}
```

---

## Chat com IA

### Conversar com Base de Conhecimento

**Endpoint**: `documents.chat`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  query: string;  // Pergunta do usuário
}
```

**Resposta**:
```json
{
  "answer": "Com base nos documentos, as cláusulas de pagamento estabelecem...",
  "sources": [
    {
      "documentName": "contrato.pdf",
      "chunkText": "Trecho relevante do documento...",
      "similarity": 0.95
    }
  ]
}
```

**Exemplo de Uso (cURL)**:
```bash
curl -X POST https://seu-dominio.com/api/trpc/documents.chat \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "query": "Quais são os prazos de entrega mencionados nos contratos?"
  }'
```

---

## Versionamento

### Criar Nova Versão

**Endpoint**: `versions.create`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  documentId: number;
  changeDescription?: string;  // Descrição das mudanças
}
```

**Resposta**:
```json
{
  "id": 789,
  "versionNumber": 2,
  "documentId": 123,
  "createdAt": "2025-01-02T00:00:00.000Z"
}
```

---

### Listar Versões

**Endpoint**: `versions.list`

**Método**: Query

**Autenticação**: Requerida

**Input**:
```typescript
{
  documentId: number;
}
```

**Resposta**:
```json
[
  {
    "id": 789,
    "versionNumber": 2,
    "filename": "documento_v2.pdf",
    "changeDescription": "Atualização de cláusulas",
    "createdAt": "2025-01-02T00:00:00.000Z"
  },
  {
    "id": 456,
    "versionNumber": 1,
    "filename": "documento.pdf",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## Feedback

### Enviar Feedback

**Endpoint**: `feedback.create`

**Método**: Mutation

**Autenticação**: Requerida

**Input**:
```typescript
{
  type: "bug" | "feature" | "improvement" | "other";
  title: string;          // Mínimo 5 caracteres
  description: string;    // Mínimo 10 caracteres
  priority?: "low" | "medium" | "high";
}
```

**Resposta**:
```json
{
  "id": 101,
  "status": "open",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Listar Meus Feedbacks

**Endpoint**: `feedback.list`

**Método**: Query

**Autenticação**: Requerida

**Resposta**:
```json
[
  {
    "id": 101,
    "type": "feature",
    "title": "Adicionar exportação em Excel",
    "description": "Seria útil poder exportar...",
    "status": "in_progress",
    "priority": "medium",
    "adminResponse": "Estamos trabalhando nisso!",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## Analytics

### Uploads por Período

**Endpoint**: `analytics.uploadsByPeriod`

**Método**: Query

**Autenticação**: Admin

**Input**:
```typescript
{
  days?: number;  // Padrão: 30
}
```

**Resposta**:
```json
[
  {
    "date": "2025-01-01",
    "count": 15
  },
  {
    "date": "2025-01-02",
    "count": 23
  }
]
```

---

### Atividade de Usuários

**Endpoint**: `analytics.userActivity`

**Método**: Query

**Autenticação**: Admin

**Resposta**:
```json
[
  {
    "userId": 1,
    "userName": "João Silva",
    "userEmail": "joao@example.com",
    "documentCount": 45,
    "totalSize": 104857600,
    "lastUpload": "2025-01-05T10:30:00.000Z"
  }
]
```

---

## Administração

### Estatísticas Globais

**Endpoint**: `admin.stats`

**Método**: Query

**Autenticação**: Admin

**Resposta**:
```json
{
  "totalDocuments": 1250,
  "totalUsers": 45,
  "totalChunks": 18750,
  "totalEmbeddings": 18750,
  "documentsByStatus": [
    { "status": "completed", "count": 1200 },
    { "status": "processing", "count": 30 },
    { "status": "failed", "count": 20 }
  ],
  "documentsByType": [
    { "fileType": "pdf", "count": 800 },
    { "fileType": "xlsx", "count": 300 },
    { "fileType": "txt", "count": 150 }
  ]
}
```

---

### Listar Todos os Documentos

**Endpoint**: `admin.listDocuments`

**Método**: Query

**Autenticação**: Admin

**Input**:
```typescript
{
  limit?: number;      // Padrão: 50
  offset?: number;     // Padrão: 0
  userId?: number;     // Filtrar por usuário
  status?: string;     // Filtrar por status
  fileType?: string;   // Filtrar por tipo
}
```

---

### Deletar Documento (Admin)

**Endpoint**: `admin.deleteDocument`

**Método**: Mutation

**Autenticação**: Admin

**Input**:
```typescript
{
  documentId: number;
}
```

**Resposta**:
```json
{
  "success": true
}
```

---

## Integração com N8N

### Exemplo de Workflow N8N

#### 1. Upload de Documento via Webhook

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "upload-document",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "HTTP Request - Upload",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://seu-dominio.com/api/trpc/documents.upload",
        "authentication": "genericCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "filename",
              "value": "={{$json[\"filename\"]}}"
            },
            {
              "name": "fileType",
              "value": "={{$json[\"fileType\"]}}"
            },
            {
              "name": "base64Data",
              "value": "={{$json[\"base64Data\"]}}"
            }
          ]
        }
      }
    }
  ]
}
```

#### 2. Busca Semântica Automática

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      }
    },
    {
      "name": "HTTP Request - Search",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://seu-dominio.com/api/trpc/documents.search",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "query",
              "value": "contratos vencendo"
            },
            {
              "name": "topK",
              "value": 10
            }
          ]
        }
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "subject": "Contratos Vencendo",
        "text": "={{$json[\"results\"]}}"
      }
    }
  ]
}
```

#### 3. Chat Bot com RAG

```json
{
  "nodes": [
    {
      "name": "Webhook - Chat",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "chat-rag",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "HTTP Request - Chat",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://seu-dominio.com/api/trpc/documents.chat",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "query",
              "value": "={{$json[\"message\"]}}"
            }
          ]
        }
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json[\"answer\"]}}"
      }
    }
  ]
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 401 | Não autenticado |
| 403 | Sem permissão (requer admin) |
| 404 | Recurso não encontrado |
| 413 | Arquivo muito grande (máx 100MB) |
| 422 | Dados de entrada inválidos |
| 500 | Erro interno do servidor |

---

## Rate Limiting

- **Upload**: 10 arquivos por minuto por usuário
- **Busca**: 60 requisições por minuto por usuário
- **Chat**: 30 requisições por minuto por usuário

---

## Suporte

Para dúvidas ou problemas, use o sistema de feedback integrado ou entre em contato através de https://help.manus.im
