import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, File, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SUPPORTED_TYPES = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Upload() {
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, "uploading" | "success" | "error">>({});

  const { data: knowledgeBases, isLoading: loadingBases } = trpc.knowledgeBases.list.useQuery();

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: (data, variables) => {
      const fileName = variables.filename;
      setUploadStatus(prev => ({ ...prev, [fileName]: "success" }));
      setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
      toast.success(`${fileName} enviado com sucesso!`);
    },
    onError: (error, variables) => {
      const fileName = variables.filename;
      setUploadStatus(prev => ({ ...prev, [fileName]: "error" }));
      toast.error(`Erro ao enviar ${fileName}: ${error.message}`);
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      Object.keys(SUPPORTED_TYPES).includes(file.type)
    );

    if (validFiles.length !== droppedFiles.length) {
      toast.error("Alguns arquivos não são suportados e foram ignorados");
    }

    // Validar tamanho
    const oversizedFiles = validFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Arquivos muito grandes (máx 100MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validar tamanho
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Arquivos muito grandes (máx 100MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const uploadFile = async (file: File) => {
    const fileName = file.name;
    setUploadStatus(prev => ({ ...prev, [fileName]: "uploading" }));
    setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fileName] || 0;
        if (current >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [fileName]: current + 10 };
      });
    }, 200);

    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      
      if (!selectedKnowledgeBaseId) {
        toast.error("Selecione uma base de conhecimento primeiro");
        return;
      }

      await uploadMutation.mutateAsync({
        filename: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        base64Data,
        mimeType: file.type,
        knowledgeBaseId: selectedKnowledgeBaseId,
      });

      clearInterval(progressInterval);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
    }
  };

  const handleUploadAll = async () => {
    for (const file of files) {
      await uploadFile(file);
    }
    
    setTimeout(() => {
      setLocation("/documents");
    }, 1500);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Início
        </Button>
        <h1 className="text-3xl font-bold mb-2">Upload de Documentos</h1>
        <p className="text-muted-foreground">
          Envie documentos para alimentar sua base de conhecimento RAG
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Base de Conhecimento</CardTitle>
          <CardDescription>
            Escolha em qual base os documentos serão armazenados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBases ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !knowledgeBases || knowledgeBases.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Você precisa criar uma base de conhecimento antes de fazer upload.
              </p>
              <Button onClick={() => setLocation("/knowledge-bases")}>
                Criar Base de Conhecimento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Base de Conhecimento *</label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={selectedKnowledgeBaseId || ""}
                onChange={(e) => setSelectedKnowledgeBaseId(Number(e.target.value))}
              >
                <option value="">Selecione uma base...</option>
                {knowledgeBases.filter(kb => kb.isActive === true || kb.isActive === 1).map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name} ({kb.description || "Sem descrição"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedKnowledgeBaseId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecionar Arquivos</CardTitle>
            <CardDescription>
              Suportamos PDF, Excel, CSV, imagens (PNG/JPG) e arquivos de texto
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-border"}
            `}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Formatos suportados: PDF, TXT, CSV, XLSX, PNG, JPG
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-input" className="cursor-pointer">
                Selecionar Arquivos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Selecionados ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file, index) => {
              const status = uploadStatus[file.name];
              const progress = uploadProgress[file.name] || 0;

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "uploading" && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {status === "success" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {status === "error" && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {!status && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  {status === "uploading" && (
                    <Progress value={progress} className="h-2" />
                  )}
                </div>
              );
            })}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUploadAll}
                disabled={uploadMutation.isPending || files.every(f => uploadStatus[f.name])}
                className="flex-1"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Todos"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/documents")}
              >
                Ver Documentos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
