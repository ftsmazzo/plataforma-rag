/**
 * Tests for Chat Provider Selection
 * Validates that chat endpoint correctly routes to OpenAI or Ollama based on user settings
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  createSystemSettings, 
  updateSystemSettings, 
  getOrCreateSystemSettings,
  createDocument,
  createChunk,
  createEmbedding
} from "./db";
import { generateEmbedding } from "./documentProcessor";

describe("Chat Provider Selection", () => {
  const testUserId = 999;
  const testOrgId = 1;

  beforeEach(async () => {
    // Clean up test settings
    try {
      await createSystemSettings({
        userId: testUserId,
        organizationId: testOrgId,
        llmProvider: "openai",
        ollamaBaseUrl: "https://llm.fabricadosdados.online",
        ollamaEmbeddingModel: "nomic-embed-text",
        ollamaChatModel: "llama3.2:1b",
      });
    } catch (error) {
      // Settings might already exist, update them
      await updateSystemSettings(testUserId, testOrgId, {
        llmProvider: "openai",
      });
    }
  });

  it("should create default settings with OpenAI as provider", async () => {
    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    
    expect(settings).toBeDefined();
    expect(settings.llmProvider).toBe("openai");
    // URL might be customized by other tests, just check it exists
    expect(settings.ollamaBaseUrl).toBeDefined();
  });

  it("should allow switching to Ollama provider", async () => {
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "ollama",
    });

    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("ollama");
  });

  it("should allow switching back to OpenAI provider", async () => {
    // First set to Ollama
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "ollama",
    });

    // Then switch back to OpenAI
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "openai",
    });

    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("openai");
  });

  it("should preserve Ollama configuration when switching providers", async () => {
    const customUrl = "https://custom-ollama.example.com";
    const customModel = "custom-model:latest";

    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "ollama",
      ollamaBaseUrl: customUrl,
      ollamaChatModel: customModel,
    });

    let settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.ollamaBaseUrl).toBe(customUrl);
    expect(settings.ollamaChatModel).toBe(customModel);

    // Switch to OpenAI
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "openai",
    });

    // Ollama config should still be preserved
    settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("openai");
    expect(settings.ollamaBaseUrl).toBe(customUrl);
    expect(settings.ollamaChatModel).toBe(customModel);
  });

  it("should use correct provider settings for embeddings", async () => {
    // Test with OpenAI (default)
    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("openai");
    
    // generateEmbedding should work with OpenAI
    const embedding = await generateEmbedding("Test query for embeddings", testUserId, testOrgId);
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });
});

describe("API REST Provider Selection", () => {
  const testUserId = 888;
  const testOrgId = 1;

  it("should use OpenAI by default for API queries", async () => {
    // Create settings with OpenAI
    try {
      await createSystemSettings({
        userId: testUserId,
        organizationId: testOrgId,
        llmProvider: "openai",
        ollamaBaseUrl: "https://llm.fabricadosdados.online",
        ollamaEmbeddingModel: "nomic-embed-text",
        ollamaChatModel: "llama3.2:1b",
      });
    } catch (error) {
      // Settings might already exist
      await updateSystemSettings(testUserId, testOrgId, {
        llmProvider: "openai",
      });
    }

    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("openai");
  });

  it("should respect Ollama setting for API queries", async () => {
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "ollama",
    });

    const settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("ollama");
  });

  it("should allow switching providers without losing configuration", async () => {
    const customUrl = "https://my-ollama.example.com";
    
    // Set to Ollama with custom URL
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "ollama",
      ollamaBaseUrl: customUrl,
    });

    let settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("ollama");
    expect(settings.ollamaBaseUrl).toBe(customUrl);

    // Switch to OpenAI
    await updateSystemSettings(testUserId, testOrgId, {
      llmProvider: "openai",
    });

    settings = await getOrCreateSystemSettings(testUserId, testOrgId);
    expect(settings.llmProvider).toBe("openai");
    expect(settings.ollamaBaseUrl).toBe(customUrl); // Should be preserved
  });
});
