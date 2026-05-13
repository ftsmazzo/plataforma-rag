import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, FileText, Download, Edit } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { EditMetadataDialog } from "@/components/EditMetadataDialog";

export default function DocumentDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/documents/:id");
  const documentId = params?.id ? parseInt(params.id) : 0;

  const { data: document, isLoading } = trpc.documents.get.useQuery(
    { id: documentId },
    { enabled: documentId > 0 }
  );

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Documento não encontrado</h3>
          <Button onClick={() => setLocation("/documents")}>
            Voltar para Documentos
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/documents")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{document.originalFilename}</CardTitle>
              <CardDescription>
                Detalhes e chunks do documento processado
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <EditMetadataDialog
                documentId={documentId}
                currentTags={document.tags || ""}
                currentDescription={document.description || ""}
                trigger={
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                }
              />
              <Button variant="outline" asChild>
                <a href={document.s3Url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(document.tags || document.description) && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              {document.tags && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {document.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Descrição</p>
                  <p className="text-sm text-muted-foreground">{document.description}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo de Arquivo</p>
              <Badge variant="outline">{document.fileType.toUpperCase()}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tamanho</p>
              <p className="font-medium">{formatFileSize(document.fileSize)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge 
                variant={document.status === "completed" ? "default" : "secondary"}
                className={document.status === "completed" ? "bg-green-500" : ""}
              >
                {document.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Chunks</p>
              <p className="font-medium">{document.totalChunks || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data de Upload</p>
              <p className="font-medium">{formatDate(document.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
              <p className="font-medium">{formatDate(document.updatedAt)}</p>
            </div>
          </div>

          {document.errorMessage && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">Erro no Processamento</p>
              <p className="text-sm text-destructive/80">{document.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chunks Processados</CardTitle>
          <CardDescription>
            Pedaços de texto extraídos e indexados para busca semântica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!document.chunks || document.chunks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {document.status === "processing" 
                  ? "Processando documento..." 
                  : "Nenhum chunk disponível"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {document.chunks.map((chunk, index) => (
                <div key={chunk.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Chunk {index + 1}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {chunk.tokenCount} tokens
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                  {chunk.metadata && chunk.metadata !== "{}" && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Metadata: {chunk.metadata}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
