import { useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Database, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { TableViewer } from "@/components/TableViewer";

export default function DatabaseControlPanel() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter states
  const [filterKbId, setFilterKbId] = useState<number | undefined>();
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Queries
  const statsQuery = trpc.database.stats.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5s
  });
  
  const kbStatsQuery = trpc.database.knowledgeBaseStats.useQuery();
  const apiLogsQuery = trpc.database.recentApiLogs.useQuery({ 
    limit: 20,
    knowledgeBaseId: filterKbId,
    searchText: filterSearch || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });

  const clearDbMutation = trpc.database.clearDatabase.useMutation({
    onSuccess: () => {
      alert("Banco de dados limpo com sucesso!");
      handleRefresh();
    },
    onError: (error) => {
      alert(`Erro ao limpar banco: ${error.message}`);
    },
  });

  const handleClearDatabase = () => {
    if (confirm("⚠️ ATENÇÃO: Isso vai deletar TODOS os documentos, chunks, embeddings e logs de API. Bases de conhecimento e API keys serão mantidas. Deseja continuar?")) {
      clearDbMutation.mutate();
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar este painel</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleRefresh = () => {
    statsQuery.refetch();
    kbStatsQuery.refetch();
    apiLogsQuery.refetch();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Painel de Controle do Banco</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearDatabase} 
              disabled={clearDbMutation.isPending}
            >
              {clearDbMutation.isPending ? "Limpando..." : "Limpar Banco"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={statsQuery.isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${statsQuery.isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Estatísticas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Gerais do Banco</CardTitle>
            <CardDescription>Visão geral de todas as tabelas</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : statsQuery.data ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.organizations}</div>
                  <div className="text-sm text-muted-foreground">Organizações</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.users}</div>
                  <div className="text-sm text-muted-foreground">Usuários</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.knowledgeBases}</div>
                  <div className="text-sm text-muted-foreground">Bases de Conhecimento</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.apiKeys}</div>
                  <div className="text-sm text-muted-foreground">API Keys</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.documents}</div>
                  <div className="text-sm text-muted-foreground">Documentos</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.chunks}</div>
                  <div className="text-sm text-muted-foreground">Chunks</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.embeddings}</div>
                  <div className="text-sm text-muted-foreground">Embeddings</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{statsQuery.data.apiLogs}</div>
                  <div className="text-sm text-muted-foreground">Logs de API</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">Erro ao carregar estatísticas</div>
            )}
          </CardContent>
        </Card>

        {/* Bases de Conhecimento */}
        <Card>
          <CardHeader>
            <CardTitle>Bases de Conhecimento</CardTitle>
            <CardDescription>Detalhamento por base</CardDescription>
          </CardHeader>
          <CardContent>
            {kbStatsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : kbStatsQuery.data && kbStatsQuery.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Documentos</TableHead>
                    <TableHead className="text-right">Chunks</TableHead>
                    <TableHead className="text-right">Embeddings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbStatsQuery.data.map((kb) => (
                    <TableRow key={kb.id}>
                      <TableCell className="font-mono text-sm">{kb.id}</TableCell>
                      <TableCell className="font-medium">{kb.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          kb.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {kb.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{kb.documentsCount}</TableCell>
                      <TableCell className="text-right">{kb.chunksCount}</TableCell>
                      <TableCell className="text-right">{kb.embeddingsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">Nenhuma base de conhecimento encontrada</div>
            )}
          </CardContent>
        </Card>

        {/* Logs de API */}
        <Card>
          <CardHeader>
            <CardTitle>Logs Recentes de API</CardTitle>
            <CardDescription>Últimas 20 consultas via API REST</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base de Conhecimento</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterKbId || ""}
                  onChange={(e) => setFilterKbId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Todas</option>
                  {kbStatsQuery.data?.map((kb) => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Buscar em perguntas/respostas..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            {apiLogsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : apiLogsQuery.data && apiLogsQuery.data.length > 0 ? (
              <div className="space-y-4">
                {apiLogsQuery.data.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-muted-foreground">#{log.id}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Base: {log.knowledgeBaseName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {log.responseTime}ms
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {log.sourcesCount} fontes
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Pergunta:</div>
                      <div className="text-sm text-muted-foreground">{log.query}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Resposta:</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{log.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">Nenhum log de API encontrado</div>
            )}
          </CardContent>
        </Card>

        {/* Visualização de Tabelas - Estilo Database UI */}
        <TableViewer />
      </div>
    </div>
  );
}
