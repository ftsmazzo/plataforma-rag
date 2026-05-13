import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Bot, User, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentName: string;
    chunkText: string;
    similarity: number;
  }>;
}

export default function Chat() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu assistente de base de conhecimento. Faça perguntas sobre os documentos que você enviou e eu vou buscar as informações relevantes para responder.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.documents.chat.useMutation({
    onSuccess: (data: { answer: string; sources: Array<{ documentName: string; chunkText: string; similarity: number }> }) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Desculpe, ocorreu um erro: ${error.message}`,
        },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    chatMutation.mutate({ query: userMessage });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Chat com Base de Conhecimento</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {user?.name || user?.email}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-6 flex flex-col h-[calc(100vh-4rem)]">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    message.role === "user" ? "order-first" : ""
                  }`}
                >
                  <Card
                    className={`p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </Card>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Fontes consultadas:
                      </p>
                      {message.sources.map((source, idx) => (
                        <Card key={idx} className="p-2 bg-muted/50">
                          <p className="text-xs font-medium">
                            {source.documentName}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {source.chunkText}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Relevância: {(source.similarity * 100).toFixed(1)}%
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <Card className="p-4 bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre seus documentos..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}
