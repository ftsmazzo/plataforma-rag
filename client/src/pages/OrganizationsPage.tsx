import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, Users, FileText, Loader2, ArrowLeft, Settings, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function OrganizationsPage() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: organizations, isLoading } = trpc.organizations.list.useQuery();
  const { data: orgStats } = trpc.organizations.stats.useQuery(
    { id: selectedOrgId! },
    { enabled: !!selectedOrgId && isStatsDialogOpen }
  );
  const { data: orgUsers } = trpc.organizations.users.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: !!selectedOrgId && isUsersDialogOpen }
  );
  const { data: usersWithoutOrg } = trpc.organizations.usersWithoutOrg.useQuery();

  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: () => {
      toast.success("Organização criada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewOrg({ name: "", slug: "", description: "" });
      utils.organizations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao criar organização: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.organizations.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Organização desativada");
      utils.organizations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const activateMutation = trpc.organizations.activate.useMutation({
    onSuccess: () => {
      toast.success("Organização ativada");
      utils.organizations.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const assignUserMutation = trpc.organizations.assignUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário atribuído à organização");
      utils.organizations.users.invalidate();
      utils.organizations.usersWithoutOrg.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newOrg.name || !newOrg.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    createMutation.mutate(newOrg);
  };

  const handleSlugChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewOrg({ ...newOrg, name, slug });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Início
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Organizações</h1>
          <p className="text-muted-foreground">
            Crie e gerencie organizações para isolamento multi-tenant
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
              <DialogDescription>
                Adicione uma nova organização ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Organização</Label>
                <Input
                  id="name"
                  value={newOrg.name}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="Imobiliária XYZ"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (identificador único)</Label>
                <Input
                  id="slug"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  placeholder="imobiliaria-xyz"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  placeholder="Descrição da organização..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizações Cadastradas</CardTitle>
          <CardDescription>
            {organizations?.length || 0} organização(ões) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!organizations || organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma organização cadastrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {org.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {org.isActive ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrgId(org.id);
                            setIsStatsDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrgId(org.id);
                            setIsUsersDialogOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {org.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateMutation.mutate({ id: org.id })}
                            disabled={deactivateMutation.isPending}
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateMutation.mutate({ id: org.id })}
                            disabled={activateMutation.isPending}
                          >
                            Ativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estatísticas da Organização</DialogTitle>
          </DialogHeader>
          {orgStats && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Documentos</CardDescription>
                  <CardTitle className="text-2xl">{orgStats.totalDocuments}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Usuários</CardDescription>
                  <CardTitle className="text-2xl">{orgStats.totalUsers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Chunks</CardDescription>
                  <CardTitle className="text-2xl">{orgStats.totalChunks}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Embeddings</CardDescription>
                  <CardTitle className="text-2xl">{orgStats.totalEmbeddings}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Usuários da Organização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Usuários Atribuídos</h3>
              {orgUsers && orgUsers.length > 0 ? (
                <div className="border rounded-md">
                  {orgUsers.map((user) => (
                    <div key={user.id} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.name || "Sem nome"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Badge>{user.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Nenhum usuário atribuído</div>
              )}
            </div>

            {usersWithoutOrg && usersWithoutOrg.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Atribuir Novos Usuários</h3>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {usersWithoutOrg.map((user) => (
                    <div key={user.id} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{user.name || "Sem nome"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (selectedOrgId) {
                            assignUserMutation.mutate({
                              userId: user.id,
                              organizationId: selectedOrgId,
                            });
                          }
                        }}
                        disabled={assignUserMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Atribuir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
