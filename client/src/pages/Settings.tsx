import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "failed">("idle");

  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const [llmProvider, setLlmProvider] = useState<"openai" | "ollama">("openai");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("https://llm.fabricadosdados.online");
  const [ollamaEmbeddingModel, setOllamaEmbeddingModel] = useState("nomic-embed-text");
  const [ollamaChatModel, setOllamaChatModel] = useState("llama3.2:1b");

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setLlmProvider(settings.llmProvider as "openai" | "ollama");
      setOllamaBaseUrl(settings.ollamaBaseUrl || "https://llm.fabricadosdados.online");
      setOllamaEmbeddingModel(settings.ollamaEmbeddingModel || "nomic-embed-text");
      setOllamaChatModel(settings.ollamaChatModel || "llama3.2:1b");
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      utils.settings.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const testConnectionMutation = trpc.settings.testConnection.useMutation({
    onSuccess: (data) => {
      setIsTestingConnection(false);
      if (data.success) {
        setConnectionStatus("success");
        toast.success("Conexão com Ollama estabelecida!");
      } else {
        setConnectionStatus("failed");
        toast.error("Falha ao conectar com Ollama");
      }
    },
    onError: (error) => {
      setIsTestingConnection(false);
      setConnectionStatus("failed");
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      llmProvider,
      ollamaBaseUrl,
      ollamaEmbeddingModel,
      ollamaChatModel,
    });
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    testConnectionMutation.mutate({ baseUrl: ollamaBaseUrl });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Configurações do Sistema</CardTitle>
          <CardDescription>
            Configure o provedor de LLM (OpenAI ou Ollama local)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>Provedor de LLM</Label>
            <RadioGroup value={llmProvider} onValueChange={(value) => setLlmProvider(value as "openai" | "ollama")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai" className="cursor-pointer">
                  OpenAI (Nuvem) - Recomendado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ollama" id="ollama" />
                <Label htmlFor="ollama" className="cursor-pointer">
                  Ollama (Local) - Requer configuração
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Ollama Configuration */}
          {llmProvider === "ollama" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Configuração do Ollama</h3>
              
              <div className="space-y-2">
                <Label htmlFor="ollamaBaseUrl">URL do Servidor Ollama</Label>
                <Input
                  id="ollamaBaseUrl"
                  type="url"
                  value={ollamaBaseUrl}
                  onChange={(e) => setOllamaBaseUrl(e.target.value)}
                  placeholder="https://llm.fabricadosdados.online"
                />
                <p className="text-sm text-muted-foreground">
                  URL do servidor Ollama (com Cloudflare Tunnel)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollamaEmbeddingModel">Modelo de Embeddings</Label>
                <Input
                  id="ollamaEmbeddingModel"
                  value={ollamaEmbeddingModel}
                  onChange={(e) => setOllamaEmbeddingModel(e.target.value)}
                  placeholder="nomic-embed-text"
                />
                <p className="text-sm text-muted-foreground">
                  Modelo usado para gerar embeddings dos documentos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollamaChatModel">Modelo de Chat</Label>
                <Input
                  id="ollamaChatModel"
                  value={ollamaChatModel}
                  onChange={(e) => setOllamaChatModel(e.target.value)}
                  placeholder="llama3.2:1b"
                />
                <p className="text-sm text-muted-foreground">
                  Modelo usado para gerar respostas no chat
                </p>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !ollamaBaseUrl}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {connectionStatus === "success" && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Conectado</span>
                  </div>
                )}

                {connectionStatus === "failed" && (
                  <div className="flex items-center text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Falha na conexão</span>
                  </div>
                )}
              </div>

              {/* Last Test Info */}
              {settings?.lastTestedAt && (
                <p className="text-xs text-muted-foreground">
                  Último teste: {new Date(settings.lastTestedAt).toLocaleString("pt-BR")} -{" "}
                  {settings.lastTestStatus === "success" ? "✅ Sucesso" : "❌ Falha"}
                </p>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-semibold mb-2">ℹ️ Informações Importantes</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>OpenAI:</strong> Usa modelos na nuvem (requer créditos)</li>
              <li>• <strong>Ollama:</strong> Usa modelos locais (gratuito, mas requer setup)</li>
              <li>• Para usar Ollama, você precisa ter um servidor rodando com Cloudflare Tunnel</li>
              <li>• Embeddings existentes não serão reprocessados ao trocar de provedor</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
