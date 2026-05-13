import { useState } from "react";
import * as React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Columns } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABLES = [
  { name: "users", label: "Usuários" },
  { name: "organizations", label: "Organizações" },
  { name: "knowledge_bases", label: "Bases de Conhecimento" },
  { name: "api_keys", label: "API Keys" },
  { name: "api_logs", label: "Logs de API" },
  { name: "documents", label: "Documentos" },
  { name: "document_chunks", label: "Chunks" },
  { name: "embeddings", label: "Embeddings" },
  { name: "feedback", label: "Feedback" },
] as const;

type TableName = typeof TABLES[number]["name"];

export function TableViewer() {
  const [selectedTable, setSelectedTable] = useState<TableName>("users");
  const [showColumnsDialog, setShowColumnsDialog] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const tableDataQuery = trpc.database.getTableData.useQuery({
    tableName: selectedTable,
    limit: 100,
  });

  // Initialize visible columns when data loads
  React.useEffect(() => {
    if (tableDataQuery.data && tableDataQuery.data.columns.length > 0) {
      setVisibleColumns(tableDataQuery.data.columns);
    }
  }, [tableDataQuery.data]);

  const handleRefresh = () => {
    tableDataQuery.refetch();
  };

  const toggleColumn = (column: string) => {
    if (visibleColumns.includes(column)) {
      setVisibleColumns(visibleColumns.filter(c => c !== column));
    } else {
      setVisibleColumns([...visibleColumns, column]);
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value instanceof Date) return value.toLocaleString("pt-BR");
    return String(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualização de Tabelas</CardTitle>
            <CardDescription>Dados brutos das tabelas do banco de dados</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnsDialog(true)}
              disabled={!tableDataQuery.data}
            >
              <Columns className="mr-2 h-4 w-4" />
              Colunas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={tableDataQuery.isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${tableDataQuery.isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Sidebar com lista de tabelas */}
          <div className="w-48 shrink-0 space-y-1 border-r pr-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Tabelas</div>
            {TABLES.map((table) => (
              <button
                key={table.name}
                onClick={() => {
                  setSelectedTable(table.name);
                  setVisibleColumns([]); // Reset visible columns
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedTable === table.name
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {table.name}
              </button>
            ))}
          </div>

          {/* Área principal com tabela */}
          <div className="flex-1 overflow-x-auto">
            {tableDataQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tableDataQuery.data && tableDataQuery.data.rows.length > 0 ? (
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  {tableDataQuery.data.totalRows} registros encontrados
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableDataQuery.data.columns
                          .filter(col => visibleColumns.includes(col))
                          .map((column) => (
                            <TableHead key={column} className="font-medium">
                              {column}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableDataQuery.data.rows.map((row: any, index: number) => (
                        <TableRow key={index}>
                          {tableDataQuery.data!.columns
                            .filter(col => visibleColumns.includes(col))
                            .map((column) => (
                              <TableCell key={column} className="font-mono text-xs">
                                {formatCellValue(row[column])}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Nenhum registro encontrado nesta tabela
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialog de seleção de colunas */}
      <Dialog open={showColumnsDialog} onOpenChange={setShowColumnsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Colunas</DialogTitle>
            <DialogDescription>
              Escolha quais colunas deseja visualizar na tabela
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tableDataQuery.data?.columns.map((column) => (
              <label
                key={column}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-mono">{column}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns(tableDataQuery.data?.columns || [])}
            >
              Selecionar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns([])}
            >
              Limpar Seleção
            </Button>
            <Button size="sm" onClick={() => setShowColumnsDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
