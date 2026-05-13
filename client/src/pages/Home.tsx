import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Database, Search, LogOut, LogIn, Shield, MessageSquare, Building2, Book, Settings, Users } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary drop-shadow-sm" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              RAG Knowledge Base
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-5xl font-extrabold mb-6 tracking-tight text-foreground/90">
            Sistema de Base de Conhecimento RAG
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            Gerencie documentos, processe conteúdo e realize buscas semânticas inteligentes com IA.
          </p>
          
          {!isAuthenticated ? (
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
              <a href={getLoginUrl()}>
                <LogIn className="mr-2 h-5 w-5" />
                Fazer Login
              </a>
            </Button>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
            >
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/upload")}>
                <CardHeader>
                  <Upload className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>Upload de Documentos</CardTitle>
                  <CardDescription>
                    Envie PDFs, planilhas, imagens e arquivos de texto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Enviar Arquivos
                  </Button>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/documents")}>
                <CardHeader>
                  <Database className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>Base de Conhecimento</CardTitle>
                  <CardDescription>
                    Visualize e gerencie documentos processados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Base de Documentos
                  </Button>
                </CardContent>
              </Card>
              </motion.div>



              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/feedback")}>
                <CardHeader>
                  <MessageSquare className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>Feedback</CardTitle>
                  <CardDescription>
                    Envie sugestões e reporte problemas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Enviar Feedback
                  </Button>
                </CardContent>
              </Card>
              </motion.div>

              {user?.role === "admin" && (
                <>
                  <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/admin")}>
                    <CardHeader>
                      <Shield className="h-12 w-12 mb-4 text-primary" />
                      <CardTitle>Painel Admin</CardTitle>
                      <CardDescription>
                        Gerencie todos os documentos e usuários
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="default">
                        Acessar Painel
                      </Button>
                    </CardContent>
                  </Card>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/admin/users")}>
                    <CardHeader>
                      <Users className="h-12 w-12 mb-4 text-primary" />
                      <CardTitle>Gerenciar Usuários</CardTitle>
                      <CardDescription>
                        Visualize e gerencie usuários e suas bases
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="default">
                        Gerenciar Usuários
                      </Button>
                    </CardContent>
                  </Card>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
                  <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/database")}>
                    <CardHeader>
                      <Database className="h-12 w-12 mb-4 text-primary" />
                      <CardTitle>Painel do Banco</CardTitle>
                      <CardDescription>
                        Visualize estatísticas e logs de API
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="default">
                        Acessar Painel
                      </Button>
                    </CardContent>
                  </Card>
                  </motion.div>
                </>
              )}

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/knowledge-bases")}>
                <CardHeader>
                  <Database className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>Bases de Conhecimento</CardTitle>
                  <CardDescription>
                    Organize documentos em bases isoladas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Gerenciar Bases
                  </Button>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/api-keys")}>
                <CardHeader>
                  <Shield className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Gerencie chaves para integração externa (n8n)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    Gerenciar API Keys
                  </Button>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/api-docs")}>
                <CardHeader>
                  <Book className="h-12 w-12 mb-4 text-blue-600" />
                  <CardTitle>Documentação da API</CardTitle>
                  <CardDescription>
                    Exemplos de integração com curl e n8n
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    Ver Documentação
                  </Button>
                </CardContent>
              </Card>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white/60 backdrop-blur-md" onClick={() => setLocation("/settings")}>
                <CardHeader>
                  <Settings className="h-12 w-12 mb-4 text-orange-600" />
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Escolha entre OpenAI (nuvem) ou Ollama (local)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    Configurar Sistema
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Como Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload</h4>
              <p className="text-sm text-muted-foreground">
                Envie seus documentos em diversos formatos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-2">Processamento</h4>
              <p className="text-sm text-muted-foreground">
                IA extrai texto e divide em chunks semânticos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-2">Embeddings</h4>
              <p className="text-sm text-muted-foreground">
                Gera vetores semânticos com OpenAI
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">4</span>
              </div>
              <h4 className="font-semibold mb-2">Busca</h4>
              <p className="text-sm text-muted-foreground">
                Encontre informações relevantes instantaneamente
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Desenvolvido por <strong>Fábrica IA</strong></p>
        </div>
      </footer>
    </div>
  );
}
