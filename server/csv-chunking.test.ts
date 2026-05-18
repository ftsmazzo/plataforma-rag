import { describe, it, expect } from "vitest";
import {
  chunkSpreadsheet,
  chunkText,
  formatSpreadsheetRowChunk,
  generateEmbedding,
  isValidChunkContent,
  parseDelimitedLine,
} from "./documentProcessor";

describe("Spreadsheet row chunking", () => {
  it("should create one chunk per data row", () => {
    const csvHeader = "id,nome,endereco,cidade";
    const csvRows = Array.from(
      { length: 100 },
      (_, i) => `${i + 1},Escola ${i + 1},Rua ${i + 1},Cidade ${i + 1}`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const chunks = chunkSpreadsheet(csvContent);

    expect(chunks.length).toBe(100);
    chunks.forEach((chunk) => {
      expect(chunk.metadata.chunkType).toBe("spreadsheet_row");
      expect(chunk.content).toContain("nome:");
      expect(chunk.content).toContain("Linha:");
    });
  });

  it("should handle large CSV with one chunk per row", () => {
    const csvHeader = "id,nome,endereco,cidade,estado";
    const csvRows = Array.from(
      { length: 452 },
      (_, i) => `${i + 1},Unidade ${i + 1},Rua ${i + 1},Cidade ${i % 50},SP`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const chunks = chunkSpreadsheet(csvContent);

    expect(chunks.length).toBe(452);
    expect(chunks.every((c) => isValidChunkContent(c.content))).toBe(true);
  });

  it("should skip empty rows and whitespace-only rows", () => {
    const csvContent = [
      "id,nome,valor",
      "1,Produto A,100",
      ",,,",
      "   ,  ,  ",
      "2,Produto B,200",
    ].join("\n");

    const chunks = chunkSpreadsheet(csvContent);

    expect(chunks.length).toBe(2);
    expect(chunks[0]!.content).toContain("Produto A");
    expect(chunks[1]!.content).toContain("Produto B");
  });

  it("should format rows with column names for better retrieval", () => {
    const content = formatSpreadsheetRowChunk(
      "Vendas",
      5,
      ["id", "cliente", "valor"],
      ["5", "ACME Ltda", "1500"]
    );

    expect(content).toContain("Planilha: Vendas");
    expect(content).toContain("Linha: 5");
    expect(content).toContain("cliente: ACME Ltda");
    expect(content).toContain("valor: 1500");
  });

  it("should support multiple sheets from xlsx export format", () => {
    const text = [
      "=== Planilha: Sheet1 ===",
      "id,nome",
      "1,Alpha",
      "2,Beta",
      "",
      "=== Planilha: Sheet2 ===",
      "id,nome",
      "10,Gamma",
    ].join("\n");

    const chunks = chunkSpreadsheet(text);

    expect(chunks.length).toBe(3);
    expect(chunks.some((c) => c.content.includes("Planilha: Sheet1"))).toBe(true);
    expect(chunks.some((c) => c.content.includes("Planilha: Sheet2"))).toBe(true);
  });

  it("should parse quoted CSV fields", () => {
    const line = '"nome, completo",email,"Rua A, 100"';
    const cells = parseDelimitedLine(line, ",");

    expect(cells[0]).toBe("nome, completo");
    expect(cells[1]).toBe("email");
    expect(cells[2]).toBe("Rua A, 100");
  });

  it("should reject invalid chunk content", () => {
    expect(isValidChunkContent("   ")).toBe(false);
    expect(isValidChunkContent(",,,,,")).toBe(false);
    expect(isValidChunkContent("id: 1 | nome: Escola Municipal")).toBe(true);
  });
});

describe("Prose chunking", () => {
  it("should chunk regular text by paragraphs", () => {
    const regularText = `
Primeiro parágrafo com algum conteúdo relevante para busca.

Segundo parágrafo com mais conteúdo descritivo.

Terceiro parágrafo com ainda mais conteúdo.
    `.trim();

    const chunks = chunkText(regularText, 500, 50);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]!.metadata.chunkType).toBe("prose");
  });
});

describe("Embedding limits", () => {
  it("should truncate very long text for embeddings", async () => {
    const veryLongText = "Lorem ipsum dolor sit amet. ".repeat(2000);

    const embedding = await generateEmbedding(veryLongText);

    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
  });

  it("should handle spreadsheet row chunk for embeddings", async () => {
    const rowChunk = formatSpreadsheetRowChunk(
      "Escolas",
      1,
      ["id", "nome", "cidade"],
      ["1", "Escola Teste", "São Paulo"]
    );

    const embedding = await generateEmbedding(rowChunk);

    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(1536);
  });
});
