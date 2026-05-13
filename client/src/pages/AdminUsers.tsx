import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Trash2, Database, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteKbId, setDeleteKbId] = useState<number | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const { data: users, isLoading, refetch } = trpc.admin.listUsersInOrg.useQuery();
  const { data: userKbs } = trpc.admin.getUserKnowledgeBases.useQuery(
    { userId: expandedUserId! },
    { enabled: expandedUserId !== null }
  );

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso");
      refetch();
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  const deleteKbMutation = trpc.admin.deleteKnowledgeBase.useMutation({
    onSuccess: () => {
      toast.success("Base de conhecimento excluída");
      refetch();
      setDeleteKbId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir base: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários da organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <>
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastSignedIn).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      >
                        <Database className="h-4 w-4 mr-1" />
                        Bases
                        {expandedUserId === user.id ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                        disabled={user.role === "admin"}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedUserId === user.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">Bases de Conhecimento</h4>
                          {userKbs && userKbs.length > 0 ? (
                            <div className="space-y-2">
                              {userKbs.map((kb) => (
                                <div
                                  key={kb.id}
                                  className="flex items-center justify-between p-2 bg-background rounded border"
                                >
                                  <div>
                                    <p className="font-medium">{kb.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {kb.description || "Sem descrição"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Criada em {new Date(kb.createdAt).toLocaleDateString("pt-BR")}
                                    </p>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteKbId(kb.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Nenhuma base de conhecimento encontrada
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e todos os seus dados, incluindo:
              <ul className="list-disc list-inside mt-2">
                <li>Bases de conhecimento</li>
                <li>Documentos</li>
                <li>Embeddings</li>
                <li>Configurações</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate({ userId: deleteUserId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Knowledge Base Dialog */}
      <AlertDialog open={deleteKbId !== null} onOpenChange={() => setDeleteKbId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Base de Conhecimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a base de conhecimento e todos os seus dados, incluindo:
              <ul className="list-disc list-inside mt-2">
                <li>Documentos</li>
                <li>Chunks de texto</li>
                <li>Embeddings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKbId && deleteKbMutation.mutate({ kbId: deleteKbId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Base
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
