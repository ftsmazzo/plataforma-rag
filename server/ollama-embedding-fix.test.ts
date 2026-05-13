import { describe, it, expect } from "vitest";
import { generateOllamaEmbedding } from "./ollama";

describe("Ollama Embedding Fix", () => {
  const OLLAMA_CONFIG = {
    baseUrl: "https://llm.fabricadosdados.online",
    embeddingModel: "nomic-embed-text",
    chatModel: "llama3.2:1b",
  };

  it("should generate embeddings with correct context size", async () => {
    const text = "This is a test document for embedding generation.";
    
    const embedding = await generateOllamaEmbedding(text, OLLAMA_CONFIG);
    
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(768); // nomic-embed-text dimension
    expect(embedding.every(n => typeof n === "number")).toBe(true);
  });

  it("should handle longer text without context size error", async () => {
    // Generate a longer text that previously caused "context size too large" error
    const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(50);
    
    const embedding = await generateOllamaEmbedding(longText, OLLAMA_CONFIG);
    
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(768);
  });

  it("should generate consistent embeddings for same text", async () => {
    const text = "Consistent embedding test";
    
    const embedding1 = await generateOllamaEmbedding(text, OLLAMA_CONFIG);
    const embedding2 = await generateOllamaEmbedding(text, OLLAMA_CONFIG);
    
    // Embeddings should be identical for the same input
    expect(embedding1).toEqual(embedding2);
  });

  it("should generate different embeddings for different text", async () => {
    const text1 = "First document about cats";
    const text2 = "Second document about dogs";
    
    const embedding1 = await generateOllamaEmbedding(text1, OLLAMA_CONFIG);
    const embedding2 = await generateOllamaEmbedding(text2, OLLAMA_CONFIG);
    
    // Embeddings should be different
    expect(embedding1).not.toEqual(embedding2);
  });
});
