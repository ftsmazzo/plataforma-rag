import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code, Book, Key } from "lucide-react";


export default function ApiDocumentation() {

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const apiExamples = [
    {
      id: "list-kb",
      title: "Listar Bases de Conhecimento",
      method: "GET",
      endpoint: "/api/knowledge-bases",
      description: "Retorna todas as bases de conhecimento disponíveis para sua organização",
      curl: `curl -X GET "https://seu-dominio.com/api/knowledge-bases" \\
  -H "Authorization: Bearer SUA_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": 30001,
      "name": "Base Principal",
      "description": "Documentos gerais",
      "isActive": 1,
      "createdAt": "2025-12-08T10:00:00.000Z"
    }
  ]
}`,
    },
    {
      id: "query-kb",
      title: "Consultar Base de Conhecimento",
      method: "POST",
      endpoint: "/api/kb/{id}/query",
      description: "Realiza uma consulta semântica em uma base de conhecimento específica",
      curl: `curl -X POST "https://seu-dominio.com/api/kb/30001/query" \\
  -H "Authorization: Bearer SUA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Qual o endereço do CRAS 3?",
    "topK": 3
  }'`,
      response: `{
  "success": true,
  "data": {
    "answer": "O CRAS 3 está localizado na Rua Example, 123...",
    "sources": [
      {
        "documentId": 1,
        "filename": "enderecos.pdf",
        "content": "CRAS 3 - Rua Example, 123...",
        "similarity": 0.92
      }
    ],
    "processingTime": 1234
  }
}`,
    },
  ];

  const n8nExample = {
    id: "n8n-integration",
    title: "Integração com n8n",
    description: "Configure um nó HTTP Request no n8n para consultar sua base de conhecimento",
    steps: [
      {
        title: "1. Adicione um nó HTTP Request",
        content: "Arraste um nó 'HTTP Request' para o canvas do n8n",
      },
      {
        title: "2. Configure a URL",
        content: "URL: https://seu-dominio.com/api/kb/{{$json.knowledgeBaseId}}/query",
      },
      {
        title: "3. Defina o método",
        content: "Method: POST",
      },
      {
        title: "4. Adicione o header de autenticação",
        content: `Headers:
- Name: Authorization
- Value: Bearer SUA_API_KEY`,
      },
      {
        title: "5. Configure o body",
        content: `Body Content Type: JSON
Body:
{
  "query": "{{$json.userQuestion}}",
  "topK": 3
}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Book className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Documentação da API</h1>
            <p className="text-muted-foreground">
              Guia completo para integração com a API REST
            </p>
          </div>
        </div>

        {/* Autenticação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              <CardTitle>Autenticação</CardTitle>
            </div>
            <CardDescription>
              Todas as requisições devem incluir uma API Key válida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Header de Autenticação:</p>
              <code className="text-sm">Authorization: Bearer SUA_API_KEY</code>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Você pode gerar e gerenciar suas API Keys na página{" "}
              <a href="/api-keys" className="text-blue-600 hover:underline">
                API Keys
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6 text-blue-600" />
            Endpoints Disponíveis
          </h2>

          {apiExamples.map((example) => (
            <Card key={example.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          example.method === "GET"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {example.method}
                      </span>
                      <code className="text-sm font-mono">{example.endpoint}</code>
                    </div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                    <CardDescription>{example.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* cURL Example */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Exemplo cURL:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.curl, `curl-${example.id}`)}
                    >
                      {copiedId === `curl-${example.id}` ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{example.curl}</code>
                  </pre>
                </div>

                {/* Response Example */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Resposta:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(example.response, `response-${example.id}`)}
                    >
                      {copiedId === `response-${example.id}` ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{example.response}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* n8n Integration */}
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img
                src="https://n8n.io/favicon.ico"
                alt="n8n"
                className="h-6 w-6"
              />
              {n8nExample.title}
            </CardTitle>
            <CardDescription>{n8nExample.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {n8nExample.steps.map((step, index) => (
                <div key={index} className="border-l-4 border-purple-400 pl-4">
                  <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                  <pre className="bg-white p-3 rounded text-sm whitespace-pre-wrap">
                    {step.content}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
            <CardDescription>
              Limites de requisições por minuto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Cada API Key tem um limite de requisições por minuto configurável.
              Se você exceder o limite, receberá um erro <code className="bg-muted px-2 py-1 rounded">429 Too Many Requests</code>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              💡 Você pode verificar e ajustar o rate limit de cada key na página de API Keys.
            </p>
          </CardContent>
        </Card>

        {/* Códigos de Erro */}
        <Card>
          <CardHeader>
            <CardTitle>Códigos de Erro</CardTitle>
            <CardDescription>
              Possíveis erros que você pode encontrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <code className="bg-red-100 text-red-700 px-2 py-1 rounded font-mono">401</code>
                <span>API Key inválida ou ausente</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-red-100 text-red-700 px-2 py-1 rounded font-mono">403</code>
                <span>Acesso negado (API Key desativada ou sem permissão)</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-red-100 text-red-700 px-2 py-1 rounded font-mono">404</code>
                <span>Base de conhecimento não encontrada</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-amber-100 text-amber-700 px-2 py-1 rounded font-mono">429</code>
                <span>Rate limit excedido</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-red-100 text-red-700 px-2 py-1 rounded font-mono">500</code>
                <span>Erro interno do servidor</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
