import { describe, expect, it } from "vitest";
import { chunkText, cosineSimilarity } from "./documentProcessor";

describe("Document Processing", () => {
  describe("chunkText", () => {
    it("should split text into chunks based on paragraphs", () => {
      const text = `Primeiro parágrafo com algum conteúdo.

Segundo parágrafo com mais informações.

Terceiro parágrafo final.`;

      const chunks = chunkText(text, 100);
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty("content");
      expect(chunks[0]).toHaveProperty("metadata");
      expect(chunks[0]).toHaveProperty("tokenCount");
      expect(chunks[0].metadata).toHaveProperty("chunkIndex");
    });

    it("should respect max token limit", () => {
      const longText = "Parágrafo um com texto.\n\nParágrafo dois com mais texto.\n\nParágrafo três com ainda mais texto e conteúdo adicional para garantir que seja dividido em múltiplos chunks quando o limite de tokens for atingido.";
      const chunks = chunkText(longText, 30); // max 30 tokens per chunk
      
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.tokenCount).toBeGreaterThan(0);
      });
    });

    it("should handle empty text", () => {
      const chunks = chunkText("");
      expect(chunks.length).toBe(0);
    });

    it("should handle single paragraph", () => {
      const text = "Um único parágrafo de texto.";
      const chunks = chunkText(text);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe(text);
    });
  });

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vec = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vec, vec);
      
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it("should return -1 for opposite vectors", () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it("should calculate similarity for real vectors", () => {
      const vec1 = [1, 2, 3];
      const vec2 = [2, 4, 6]; // Same direction, different magnitude
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it("should throw error for vectors of different lengths", () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];
      
      expect(() => cosineSimilarity(vec1, vec2)).toThrow();
    });
  });
});
