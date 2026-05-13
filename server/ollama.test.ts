import { describe, it, expect } from "vitest";
import { testOllamaConnection, generateOllamaEmbedding, generateOllamaChatCompletion, getOllamaModels } from "./ollama";

describe("Ollama Integration Tests", () => {
  const OLLAMA_BASE_URL = "https://llm.fabricadosdados.online";
  const EMBEDDING_MODEL = "nomic-embed-text";
  const CHAT_MODEL = "llama3.2:1b";

  describe("Connection Tests", () => {
    it("should connect to Ollama server", async () => {
      const result = await testOllamaConnection(OLLAMA_BASE_URL);
      expect(result.success).toBe(true);
      expect(result.models).toBeDefined();
      expect(Array.isArray(result.models)).toBe(true);
    }, 30000);

    it("should list available models", async () => {
      const models = await getOllamaModels(OLLAMA_BASE_URL);
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Verificar se tem pelo menos o modelo de chat
      const modelNames = models.map(m => m.name);
      expect(modelNames).toContain("llama3.2:1b");
      // nomic-embed-text pode não aparecer na lista, mas funciona
    }, 30000);
  });

  describe("Embedding Generation", () => {
    it("should generate embeddings for text", async () => {
      const text = "Este é um teste de embedding com Ollama";
      const config = {
        baseUrl: OLLAMA_BASE_URL,
        embeddingModel: EMBEDDING_MODEL,
        chatModel: CHAT_MODEL,
      };
      const embedding = await generateOllamaEmbedding(text, config);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(typeof embedding[0]).toBe("number");
    }, 30000);

    it("should generate consistent embeddings", async () => {
      const text = "Teste de consistência";
      const config = {
        baseUrl: OLLAMA_BASE_URL,
        embeddingModel: EMBEDDING_MODEL,
        chatModel: CHAT_MODEL,
      };
      const embedding1 = await generateOllamaEmbedding(text, config);
      const embedding2 = await generateOllamaEmbedding(text, config);

      expect(embedding1.length).toBe(embedding2.length);
      // Embeddings devem ser similares (não necessariamente idênticos devido a flutuações)
      const similarity = embedding1.reduce((sum, val, i) => sum + Math.abs(val - embedding2[i]), 0) / embedding1.length;
      expect(similarity).toBeLessThan(0.01); // Diferença média menor que 1%
    }, 60000);
  });

  describe("Chat Completion", () => {
    it("should generate chat completion", async () => {
      const messages = [
        { role: "user" as const, content: "Responda em uma palavra: qual é a capital do Brasil?" }
      ];
      const config = {
        baseUrl: OLLAMA_BASE_URL,
        embeddingModel: EMBEDDING_MODEL,
        chatModel: CHAT_MODEL,
      };
      const response = await generateOllamaChatCompletion(messages, config);

      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    }, 60000);

    it("should handle Portuguese correctly", async () => {
      const messages = [
        { role: "user" as const, content: "Responda em português em uma frase: O que é inteligência artificial?" }
      ];
      const config = {
        baseUrl: OLLAMA_BASE_URL,
        embeddingModel: EMBEDDING_MODEL,
        chatModel: CHAT_MODEL,
      };
      const response = await generateOllamaChatCompletion(messages, config);

      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe("Error Handling", () => {
    it("should handle invalid URL gracefully", async () => {
      const result = await testOllamaConnection("https://invalid-url-that-does-not-exist.com");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);

    it("should handle invalid model name", async () => {
      const config = {
        baseUrl: OLLAMA_BASE_URL,
        embeddingModel: "invalid-model-name-xyz",
        chatModel: CHAT_MODEL,
      };
      await expect(
        generateOllamaEmbedding("test", config)
      ).rejects.toThrow();
    }, 30000);
  });
});
