import { describe, it, expect } from "vitest";
import { chunkText, generateEmbedding } from "./documentProcessor";

describe("CSV Chunking and Embedding Limits", () => {
  it("should chunk large CSV into multiple small chunks", () => {
    // Simulate a CSV with 100 rows
    const csvHeader = "id,nome,endereco,cidade,estado,cep,telefone,email";
    const csvRows = Array.from({ length: 100 }, (_, i) => 
      `${i + 1},Escola ${i + 1},Rua ${i + 1},Cidade ${i + 1},SP,12345-678,11-9999-${i},escola${i}@example.com`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const chunks = chunkText(csvContent, 500, 50);

    // Should create multiple chunks instead of one huge chunk
    expect(chunks.length).toBeGreaterThan(5);
    
    // Each chunk should be reasonably sized (not exceeding max tokens significantly)
    chunks.forEach(chunk => {
      expect(chunk.tokenCount).toBeLessThan(600); // Allow small overflow
    });
  });

  it("should handle very large CSV (400+ rows)", () => {
    // Simulate a CSV with 452 rows (like the user's file)
    const csvHeader = "id,nome,endereco,cidade,estado,cep,telefone,email,observacoes";
    const csvRows = Array.from({ length: 452 }, (_, i) => 
      `${i + 1},Unidade ${i + 1},Rua Exemplo ${i + 1} n ${i * 10},Cidade ${i % 50},SP,${10000 + i}-000,11-${9000 + i}-0000,contato${i}@example.com,Observações da unidade ${i + 1}`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const chunks = chunkText(csvContent, 500, 50);

    // Should create many chunks
    expect(chunks.length).toBeGreaterThan(20);
    
    // No chunk should be excessively large
    chunks.forEach(chunk => {
      expect(chunk.tokenCount).toBeLessThan(700);
      // Verify content is not empty
      expect(chunk.content.length).toBeGreaterThan(0);
    });
  });

  it("should truncate very long text for embeddings", async () => {
    // Create a text that would exceed the embedding limit
    const veryLongText = "Lorem ipsum dolor sit amet. ".repeat(2000); // ~56,000 characters
    
    // This should not throw an error due to truncation
    const embedding = await generateEmbedding(veryLongText);
    
    // Should return a valid embedding
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536); // OpenAI text-embedding-3-small dimension
  });

  it("should handle CSV chunk content for embeddings", async () => {
    // Simulate a single CSV chunk
    const csvChunk = Array.from({ length: 50 }, (_, i) => 
      `${i + 1},Escola ${i + 1},Rua ${i + 1},Cidade ${i + 1},SP,12345-678,11-9999-${i},escola${i}@example.com`
    ).join("\n");

    // Should process without errors
    const embedding = await generateEmbedding(csvChunk);
    
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
  });

  it("should detect CSV format correctly", () => {
    // Create a larger CSV that will need multiple chunks
    const csvHeader = "id,name,value,description";
    const csvRows = Array.from({ length: 100 }, (_, i) => 
      `${i + 1},test${i},${i * 100},Description for item ${i + 1} with some extra text to make it longer`
    );
    const csvData = [csvHeader, ...csvRows].join("\n");
    const chunks = chunkText(csvData, 500, 50);
    
    // Should split by lines (CSV mode) and create multiple chunks
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should handle regular text (non-CSV) normally", () => {
    const regularText = `
Primeiro parágrafo com algum conteúdo.

Segundo parágrafo com mais conteúdo.

Terceiro parágrafo com ainda mais conteúdo.
    `.trim();

    const chunks = chunkText(regularText, 500, 50);
    
    // Should work normally for non-CSV text
    expect(chunks.length).toBeGreaterThan(0);
  });
});
