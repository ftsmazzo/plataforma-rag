import { useState, type ReactNode } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Database, ArrowLeft, RefreshCw, Key, BookOpen, X } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { TableViewer } from "@/components/TableViewer";

export default function DatabaseControlPanel() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  const [filterKbId, setFilterKbId] = useState<number | undefined>();
  const [filterApiKeyId, setFilterApiKeyId] = useState<number | undefined>();
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const statsQuery = trpc.database.stats.useQuery(undefined, {
    refetchInterval: 30000,
    retry: 2,
  });

  const kbStatsQuery = trpc.database.knowledgeBaseStats.useQuery(undefined, {
    retry: 2,
  });

  const apiKeysQuery = trpc.database.apiKeysList.useQuery(undefined, {
    retry: 2,
  });

  const apiLogsQuery = trpc.database.recentApiLogs.useQuery({
    limit: 50,
    knowledgeBaseId: filterKbId,
    apiKeyId: filterApiKeyId,
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
    if (
      confirm(
        "⚠️ ATENÇÃO: Isso vai deletar TODOS os documentos, chunks, embeddings e logs de API. Bases de conhecimento e API keys serão mantidas. Deseja continuar?"
      )
    ) {
      clearDbMutation.mutate();
    }
  };

  const handleRefresh = () => {
    statsQuery.refetch();
    kbStatsQuery.refetch();
    apiKeysQuery.refetch();
    apiLogsQuery.refetch();
    setRefreshKey((prev) => prev + 1);
  };

  const filterByKnowledgeBase = (kbId: number) => {
    setFilterKbId(kbId);
    setFilterApiKeyId(undefined);
    document.getElementById("api-logs-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading || !user) {
    return (
      <CenteredLayout>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CenteredLayout>
    );
  }

  if (user.role !== "admin") {
    return (
      <CenteredLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar este painel</CardDescription>
          </CardHeader>
        </Card>
      </CenteredLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <PanelHeader
          onBack={() => setLocation("/")}
          onClear={handleClearDatabase}
          onRefresh={handleRefresh}
          clearing={clearDbMutation.isPending}
          refreshing={statsQuery.isFetching}
        />
      </header>

      <div className="container py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Gerais do Banco</CardTitle>
            <CardDescription>Visão geral de todas as tabelas</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <QuerySpinner />
            ) : statsQuery.error ? (
              <ErrorBox message={statsQuery.error.message} />
            ) : statsQuery.data ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Organizações" value={statsQuery.data.organizations} />
                <StatCard label="Usuários" value={statsQuery.data.users} />
                <StatCard label="Bases de Conhecimento" value={statsQuery.data.knowledgeBases} />
                <StatCard label="API Keys" value={statsQuery.data.apiKeys} />
                <StatCard label="Documentos" value={statsQuery.data.documents} />
                <StatCard label="Chunks" value={statsQuery.data.chunks} />
                <StatCard label="Embeddings" value={statsQuery.data.embeddings} />
                <StatCard label="Logs de API" value={statsQuery.data.apiLogs} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bases de Conhecimento</CardTitle>
            <CardDescription>Documentos indexados e uso da API por base</CardDescription>
          </CardHeader>
          <CardContent>
            {kbStatsQuery.isLoading ? (
              <QuerySpinner />
            ) : kbStatsQuery.error ? (
              <ErrorBox message={kbStatsQuery.error.message} />
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
                    <TableHead className="text-right">Consultas API</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbStatsQuery.data.map((kb) => (
                    <TableRow key={kb.id}>
                      <TableCell className="font-mono text-sm">{kb.id}</TableCell>
                      <TableCell className="font-medium">{kb.name}</TableCell>
                      <TableCell>
                        <StatusBadge active={kb.isActive} />
                      </TableCell>
                      <TableCell className="text-right">{kb.documentsCount}</TableCell>
                      <TableCell className="text-right">{kb.chunksCount}</TableCell>
                      <TableCell className="text-right">{kb.embeddingsCount}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {kb.apiQueriesCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => filterByKnowledgeBase(kb.id)}>
                          Ver logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyMessage>Nenhuma base de conhecimento encontrada</EmptyMessage>
            )}
          </CardContent>
        </Card>

        {apiKeysQuery.data && apiKeysQuery.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Chaves de API
              </CardTitle>
              <CardDescription>Integrações (n8n, agentes, etc.)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeysQuery.data.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono text-sm">{key.id}</TableCell>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <StatusBadge active={Boolean(key.isActive)} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleString("pt-BR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card id="api-logs-section">
          <CardHeader>
            <CardTitle>Logs Recentes de API</CardTitle>
            <CardDescription>
              Consultas REST com base, chave e usuário identificados (últimas 50)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <FilterField label="Base de Conhecimento">
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={filterKbId || ""}
                  onChange={(e) =>
                    setFilterKbId(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Todas</option>
                  {kbStatsQuery.data?.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                      {kb.name} (ID {kb.id})
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Chave de API">
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={filterApiKeyId || ""}
                  onChange={(e) =>
                    setFilterApiKeyId(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <option value="">Todas</option>
                  {apiKeysQuery.data?.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name} (ID {key.id})
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Buscar">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Pergunta ou resposta..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </FilterField>
              <FilterField label="Data Início">
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </FilterField>
              <FilterField label="Data Fim">
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </FilterField>
            </div>

            {(filterKbId || filterApiKeyId) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {filterKbId && (
                  <FilterChip
                    label={`Base: ${
                      kbStatsQuery.data?.find((k) => k.id === filterKbId)?.name ?? filterKbId
                    }`}
                    onClear={() => setFilterKbId(undefined)}
                  />
                )}
                {filterApiKeyId && (
                  <FilterChip
                    label={`Chave: ${
                      apiKeysQuery.data?.find((k) => k.id === filterApiKeyId)?.name ??
                      filterApiKeyId
                    }`}
                    onClear={() => setFilterApiKeyId(undefined)}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterKbId(undefined);
                    setFilterApiKeyId(undefined);
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}

            {apiLogsQuery.isLoading ? (
              <QuerySpinner />
            ) : apiLogsQuery.error ? (
              <ErrorBox message={apiLogsQuery.error.message} />
            ) : apiLogsQuery.data && apiLogsQuery.data.length > 0 ? (
              <ApiLogsList logs={apiLogsQuery.data} />
            ) : (
              <EmptyMessage>Nenhum log de API encontrado para os filtros selecionados</EmptyMessage>
            )}
          </CardContent>
        </Card>

        <TableViewer key={refreshKey} />
      </div>
    </div>
  );
}

function CenteredLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center">{children}</div>;
}

function PanelHeader({
  onBack,
  onClear,
  onRefresh,
  clearing,
  refreshing,
}: {
  onBack: () => void;
  onClear: () => void;
  onRefresh: () => void;
  clearing: boolean;
  refreshing: boolean;
}) {
  return (
    <div className="container flex h-16 items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Painel de Controle do Banco</h1>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={onClear} disabled={clearing}>
          {clearing ? "Limpando..." : "Limpar Banco"}
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}

function ApiLogsList({
  logs,
}: {
  logs: Array<{
    id: number;
    createdAt: Date | string;
    knowledgeBaseId: number;
    knowledgeBaseName: string | null;
    apiKeyId: number;
    apiKeyName: string | null;
    userEmail: string | null;
    responseTime: number;
    sourcesCount: number;
    query: string;
    answer: string;
  }>;
}) {
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">#{log.id}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaBadge
                  icon={<BookOpen className="h-3 w-3" />}
                  label={log.knowledgeBaseName || `Base #${log.knowledgeBaseId}`}
                />
                <MetaBadge
                  icon={<Key className="h-3 w-3" />}
                  label={log.apiKeyName || `Chave #${log.apiKeyId}`}
                />
                {log.userEmail && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs">
                    {log.userEmail}
                  </span>
                )}
              </div>
            </div>
            <LogMetrics responseTime={log.responseTime} sourcesCount={log.sourcesCount} />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Pergunta</p>
            <p className="text-sm text-muted-foreground">{log.query}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Resposta</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{log.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogMetrics({
  responseTime,
  sourcesCount,
}: {
  responseTime: number;
  sourcesCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span>{responseTime}ms</span>
      <span>·</span>
      <span>{sourcesCount} fontes</span>
    </div>
  );
}

function MetaBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
      {icon}
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {active ? "Ativa" : "Inativa"}
    </span>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
      {label}
      <button type="button" onClick={onClear} className="hover:opacity-70" aria-label="Remover filtro">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function QuerySpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-destructive text-sm border border-destructive/30 rounded-lg bg-destructive/5 px-4">
      Erro ao carregar: {message}
    </div>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <div className="text-center text-muted-foreground py-8">{children}</div>;
}
