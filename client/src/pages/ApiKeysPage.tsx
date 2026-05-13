import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ApiKeysPage() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60); // Default: 60 req/min
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKey, setCopiedKey] = useState<number | null>(null);

  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      toast.success("API Key criada com sucesso!");
      setCreatedKey(data.key);
      setNewKeyName("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.apiKeys.deactivate.useMutation({
    onSuccess: () => {
      toast.success("API Key desativada");
      refetch();
    },
  });

  const activateMutation = trpc.apiKeys.activate.useMutation({
    onSuccess: () => {
      toast.success("API Key ativada");
      refetch();
    },
  });

  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API Key excluída");
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      toast.error("Nome da API Key é obrigatório");
      return;
    }
    if (newKeyRateLimit < 1 || newKeyRateLimit > 1000) {
      toast.error("Rate limit deve estar entre 1 e 1000 requests/minuto");
      return;
    }
    createMutation.mutate({ name: newKeyName, rateLimit: newKeyRateLimit });
  };

  const toggleVisibility = (id: number) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleKeys(newSet);
  };

  const copyToClipboard = async (key: string, id: number) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    toast.success("API Key copiada!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Início
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground">
            Gerencie chaves de API para integração externa (n8n, webhooks, etc.)
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Dê um nome descritivo para identificar esta chave
              </DialogDescription>
            </DialogHeader>
            {createdKey ? (
              <div className="space-y-4 py-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    ✅ API Key criada com sucesso!
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    Copie esta chave agora. Você não poderá vê-la novamente.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono break-all">
                      {createdKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdKey);
                        toast.success("Copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Nome da API Key *</Label>
                  <Input
                    id="key-name"
                    placeholder="Ex: Integração n8n"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (requests/minuto) *</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="60"
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo de requests permitidos por minuto (padrão: 60)
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              {createdKey ? (
                <Button
                  onClick={() => {
                    setCreatedKey(null);
                    setCreateDialogOpen(false);
                  }}
                >
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas API Keys</CardTitle>
          <CardDescription>
            Use estas chaves para autenticar requisições à API REST
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma API Key ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira chave para começar a usar a API
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key, key.id)}
                        >
                          {copiedKey === key.id ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{key.rateLimit} req/min</Badge>
                    </TableCell>
                    <TableCell>
                      {(key.isActive === true || key.isActive === 1) ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(key.isActive === true || key.isActive === 1) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateMutation.mutate({ id: key.id })}
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => activateMutation.mutate({ id: key.id })}
                          >
                            Ativar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Excluir API Key "${key.name}"?`)) {
                              deleteMutation.mutate({ id: key.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Documentação da API</CardTitle>
          <CardDescription>Como usar a API REST</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Listar Bases de Conhecimento</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              GET {window.location.origin}/api/knowledge-bases<br />
              Authorization: Bearer sk_...
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Consultar Base Específica</h3>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              POST {window.location.origin}/api/kb/{"{"}"id"{"}"}/query<br />
              Authorization: Bearer sk_...<br />
              Content-Type: application/json<br />
              <br />
              {"{"}"query": "Sua pergunta aqui", "topK": 5{"}"}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
