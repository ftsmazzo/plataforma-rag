import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function FeedbackManagement() {
  const { user, loading } = useAuth();
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<"open" | "in_progress" | "resolved" | "closed">("open");
  const [adminResponse, setAdminResponse] = useState("");

  const { data: feedbackList, refetch } = trpc.feedback.listAll.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Feedback atualizado com sucesso!");
      setSelectedFeedback(null);
      setAdminResponse("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar feedback: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Voltar para Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdate = () => {
    if (!selectedFeedback) return;

    updateMutation.mutate({
      feedbackId: selectedFeedback.id,
      status: newStatus,
      adminResponse: adminResponse || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "closed":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "outline",
      in_progress: "secondary",
      resolved: "default",
      closed: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      bug: "bg-red-100 text-red-800",
      feature: "bg-blue-100 text-blue-800",
      improvement: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[type] || colors.other} variant="outline">
        {type}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[priority] || colors.medium} variant="outline">
        {priority}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Gestão de Feedbacks
              </h1>
              <p className="text-sm text-gray-600">Gerencie feedbacks dos usuários</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Todos os Feedbacks</CardTitle>
            <CardDescription>
              Total: {feedbackList?.length || 0} feedbacks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbackList && feedbackList.length > 0 ? (
                feedbackList.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Por: {item.userName || item.userEmail || "Usuário desconhecido"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getTypeBadge(item.type)}
                      {getPriorityBadge(item.priority)}
                    </div>

                    <p className="text-sm text-gray-700">{item.description}</p>

                    {item.adminResponse && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-blue-900">Resposta do Admin:</p>
                        <p className="text-sm text-blue-800 mt-1">{item.adminResponse}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-gray-500">
                        Criado em: {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(item);
                              setNewStatus(item.status);
                              setAdminResponse(item.adminResponse || "");
                            }}
                          >
                            Gerenciar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gerenciar Feedback</DialogTitle>
                            <DialogDescription>
                              Atualize o status e adicione uma resposta
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Status</label>
                              <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Aberto</SelectItem>
                                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                                  <SelectItem value="resolved">Resolvido</SelectItem>
                                  <SelectItem value="closed">Fechado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Resposta do Admin</label>
                              <Textarea
                                placeholder="Digite sua resposta (opcional)"
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                rows={4}
                              />
                            </div>

                            <Button
                              onClick={handleUpdate}
                              className="w-full"
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? "Atualizando..." : "Atualizar Feedback"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum feedback recebido ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
