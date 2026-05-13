import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Database, Plus, Settings, BarChart3, Loader2, Download, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function KnowledgeBasesPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseDescription, setNewBaseDescription] = useState("");
  const [newBaseWebhookUrl, setNewBaseWebhookUrl] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreName, setRestoreName] = useState("");
  const [restoreDescription, setRestoreDescription] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const { data: knowledgeBases, isLoading, refetch } = trpc.knowledgeBases.list.useQuery();

  const createMutation = trpc.knowledgeBases.create.useMutation({
    onSuccess: () => {
      toast.success("Base de conhecimento criada com sucesso!");
      setCreateDialogOpen(false);
      setNewBaseName("");
      setNewBaseDescription("");
      setNewBaseWebhookUrl("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar base: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.knowledgeBases.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Base desativada");
      refetch();
    },
  });

  const activateMutation = trpc.knowledgeBases.activate.useMutation({
    onSuccess: () => {
      toast.success("Base ativada");
      refetch();
    },
  });

  const deleteMutation = trpc.knowledgeBases.delete.useMutation({
    onSuccess: () => {
      toast.success("Base excluída com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const [backupBaseId, setBackupBaseId] = useState<number | null>(null);
  const [backupBaseName, setBackupBaseName] = useState<string>("");

  const { data: backupData, refetch: refetchBackup } = trpc.knowledgeBases.backup.useQuery(
    { id: backupBaseId || 0 },
    { enabled: false }
  );

  const restoreMutation = trpc.knowledgeBases.restore.useMutation({
    onSuccess: () => {
      toast.success("Base restaurada com sucesso!");
      setRestoreDialogOpen(false);
      setRestoreName("");
      setRestoreDescription("");
      setRestoreFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar: ${error.message}`);
    },
  });

  // Effect para baixar backup quando os dados chegarem
  useEffect(() => {
    if (backupData && backupBaseName) {
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${backupBaseName}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup criado com sucesso!");
      setBackupBaseName("");
      setBackupBaseId(null);
    }
  }, [backupData, backupBaseName]);

  const handleBackup = async (baseId: number, baseName: string) => {
    try {
      setBackupBaseId(baseId);
      setBackupBaseName(baseName);
      await refetchBackup();
    } catch (error: any) {
      toast.error(`Erro ao criar backup: ${error.message}`);
      setBackupBaseName("");
      setBackupBaseId(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreName.trim()) {
      toast.error("Nome da base é obrigatório");
      return;
    }
    if (!restoreFile) {
      toast.error("Selecione um arquivo de backup");
      return;
    }

    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);
      
      restoreMutation.mutate({
        name: restoreName,
        description: restoreDescription || undefined,
        data: {
          documents: backup.documents || [],
          documentChunks: backup.documentChunks || [],
          embeddings: backup.embeddings || [],
        },
      });
    } catch (error: any) {
      toast.error(`Erro ao ler arquivo: ${error.message}`);
    }
  };

  const handleCreate = () => {
    if (!newBaseName.trim()) {
      toast.error("Nome da base é obrigatório");
      return;
    }
    createMutation.mutate({
      name: newBaseName,
      description: newBaseDescription || undefined,
      webhookUrl: newBaseWebhookUrl || undefined,
    });
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Início
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Bases de Conhecimento</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie suas bases de conhecimento isoladas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Restaurar Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restaurar Base de Conhecimento</DialogTitle>
                  <DialogDescription>
                    Importe um backup JSON para criar uma nova base
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="restore-name">Nome da Nova Base *</Label>
                    <Input
                      id="restore-name"
                      placeholder="Ex: Base Restaurada"
                      value={restoreName}
                      onChange={(e) => setRestoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restore-description">Descrição</Label>
                    <Textarea
                      id="restore-description"
                      placeholder="Descreva o propósito desta base..."
                      value={restoreDescription}
                      onChange={(e) => setRestoreDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restore-file">Arquivo de Backup (JSON) *</Label>
                    <Input
                      id="restore-file"
                      type="file"
                      accept=".json"
                      onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    />
                    {restoreFile && (
                      <p className="text-xs text-muted-foreground">
                        Arquivo selecionado: {restoreFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRestore} disabled={restoreMutation.isPending}>
                    {restoreMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Restaurar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Base
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Base de Conhecimento</DialogTitle>
                <DialogDescription>
                  Crie uma base isolada para organizar documentos por contexto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Base *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Legislação Imobiliária"
                    value={newBaseName}
                    onChange={(e) => setNewBaseName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o propósito desta base..."
                    value={newBaseDescription}
                    onChange={(e) => setNewBaseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL (Opcional)</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://seu-n8n.com/webhook/..." 
                    value={newBaseWebhookUrl}
                    onChange={(e) => setNewBaseWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Receba notificações quando documentos forem processados
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Base
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {!knowledgeBases || knowledgeBases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma base de conhecimento</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira base para organizar documentos
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Base
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBases.map((base) => (
              <KnowledgeBaseCard
                key={base.id}
                base={base}
                onDeactivate={() => deactivateMutation.mutate({ id: base.id })}
                onActivate={() => activateMutation.mutate({ id: base.id })}
                onDelete={() => {
                  if (confirm(`Tem certeza que deseja excluir a base "${base.name}"? Esta ação não pode ser desfeita.`)) {
                    deleteMutation.mutate({ id: base.id });
                  }
                }}
                onBackup={() => handleBackup(base.id, base.name)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function KnowledgeBaseCard({
  base,
  onDeactivate,
  onActivate,
  onDelete,
  onBackup,
}: {
  base: any;
  onDeactivate: () => void;
  onActivate: () => void;
  onDelete: () => void;
  onBackup: () => void;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(base.name);
  const [editDescription, setEditDescription] = useState(base.description || "");
  const [editWebhookUrl, setEditWebhookUrl] = useState(base.webhookUrl || "");
  const { data: stats } = trpc.knowledgeBases.stats.useQuery({ id: base.id });
  const utils = trpc.useUtils();

  const updateMutation = trpc.knowledgeBases.update.useMutation({
    onSuccess: () => {
      toast.success("Base atualizada com sucesso!");
      setEditDialogOpen(false);
      utils.knowledgeBases.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleUpdate = () => {
    if (!editName.trim()) {
      toast.error("Nome da base é obrigatório");
      return;
    }
    updateMutation.mutate({
      id: base.id,
      name: editName,
      description: editDescription || undefined,
      webhookUrl: editWebhookUrl || undefined,
    });
  };

  return (
    <Card className={base.isActive === 0 ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{base.name}</CardTitle>
          </div>
          {base.isActive === 1 ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativa</span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inativa</span>
          )}
        </div>
        <CardDescription className="space-y-1">
          <div className="text-xs font-mono bg-muted px-2 py-1 rounded w-fit">
            ID: {base.id}
          </div>
          <div className="line-clamp-2">
            {base.description || "Sem descrição"}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Documentos:</span>
            <span className="font-medium">{stats?.totalDocuments || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Chunks:</span>
            <span className="font-medium">{stats?.totalChunks || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Embeddings:</span>
            <span className="font-medium">{stats?.totalEmbeddings || 0}</span>
          </div>
          <div className="pt-3 border-t flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Base de Conhecimento</DialogTitle>
                  <DialogDescription>
                    Atualize o nome e descrição da base
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome da Base *</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-webhookUrl">Webhook URL (Opcional)</Label>
                  <Input
                    id="edit-webhookUrl"
                    type="url"
                    placeholder="https://seu-n8n.com/webhook/..."
                    value={editWebhookUrl}
                    onChange={(e) => setEditWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Receba notificações quando documentos forem processados
                  </p>
                </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {base.isActive === true || base.isActive === 1 ? (
              <Button variant="destructive" size="sm" onClick={onDeactivate}>
                Desativar
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={onActivate}>
                Ativar
              </Button>
            )}
          </div>
          <div className="pt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onBackup}>
              <Download className="mr-2 h-4 w-4" />
              Backup
            </Button>
          </div>
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
              Excluir Base
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
