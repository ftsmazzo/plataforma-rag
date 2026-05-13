import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Feedback() {
  const { user, loading } = useAuth();
  const [type, setType] = useState<"bug" | "feature" | "improvement" | "other">("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const { data: feedbackList, refetch } = trpc.feedback.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback enviado com sucesso!");
      setTitle("");
      setDescription("");
      setType("feature");
      setPriority("medium");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar feedback: ${error.message}`);
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
            <CardDescription>Você precisa estar logado para enviar feedback</CardDescription>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.length < 5) {
      toast.error("O título deve ter pelo menos 5 caracteres");
      return;
    }
    
    if (description.length < 10) {
      toast.error("A descrição deve ter pelo menos 10 caracteres");
      return;
    }

    createMutation.mutate({
      type,
      title,
      description,
      priority,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Feedback
              </h1>
              <p className="text-sm text-gray-600">Envie sugestões e reporte problemas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.name}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Novo Feedback</CardTitle>
              <CardDescription>
                Ajude-nos a melhorar o sistema com suas sugestões e reportes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">🐛 Bug</SelectItem>
                      <SelectItem value="feature">✨ Nova Funcionalidade</SelectItem>
                      <SelectItem value="improvement">🚀 Melhoria</SelectItem>
                      <SelectItem value="other">💬 Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Resumo do feedback (mínimo 5 caracteres)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={5}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva em detalhes seu feedback (mínimo 10 caracteres)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    minLength={10}
                    rows={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Feedback History */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Feedbacks</CardTitle>
              <CardDescription>Histórico de feedbacks enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackList && feedbackList.length > 0 ? (
                  feedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        <Badge variant="outline" className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>

                      {item.adminResponse && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-900">Resposta do Admin:</p>
                          <p className="text-sm text-blue-800 mt-1">{item.adminResponse}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum feedback enviado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
