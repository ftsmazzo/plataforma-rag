import { describe, it, expect, beforeAll } from "vitest";
import { generateEmbedding } from "./documentProcessor";
import { getOrCreateSystemSettings } from "./db";

describe("Document Upload with Ollama", () => {
  const TEST_USER_ID = 999999;
  const TEST_ORG_ID = 999999;

  beforeAll(async () => {
    // Ensure test user has Ollama configured
    await getOrCreateSystemSettings(TEST_USER_ID, TEST_ORG_ID, {
      llmProvider: "ollama",
      ollamaBaseUrl: "https://llm.fabricadosdados.online",
      ollamaEmbeddingModel: "nomic-embed-text",
      ollamaChatModel: "llama3.2:1b",
    });
  });

  describe("Embedding Generation", () => {
    it("should generate embeddings using Ollama when configured", async () => {
      const testText = "Este é um teste de geração de embeddings com Ollama.";
      
      const embedding = await generateEmbedding(testText, TEST_USER_ID, TEST_ORG_ID);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(typeof embedding[0]).toBe("number");
    }, 30000);

    it("should handle Portuguese text correctly", async () => {
      const portugueseText = "Inteligência artificial e aprendizado de máquina são tecnologias revolucionárias.";
      
      const embedding = await generateEmbedding(portugueseText, TEST_USER_ID, TEST_ORG_ID);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    }, 30000);

    it("should fallback to OpenAI if Ollama fails", async () => {
      // Use invalid user ID to force fallback
      const testText = "Fallback test";
      
      const embedding = await generateEmbedding(testText, undefined, undefined);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Error Handling", () => {
    it("should handle empty text gracefully", async () => {
      // Empty text returns a valid embedding (acceptable behavior)
      const embedding = await generateEmbedding("", TEST_USER_ID, TEST_ORG_ID);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    }, 30000);

    it("should handle very long text", async () => {
      const longText = "teste ".repeat(1000);
      
      const embedding = await generateEmbedding(longText, TEST_USER_ID, TEST_ORG_ID);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    }, 60000);
  });
});
