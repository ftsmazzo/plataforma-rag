import { describe, expect, it } from "vitest";

describe("OpenAI API Key Validation", () => {
  it("should successfully generate embeddings with provided API key", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-/);

    // Test actual API call
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: "Test embedding generation",
      }),
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveLength(1);
    expect(data.data[0]).toHaveProperty("embedding");
    expect(Array.isArray(data.data[0].embedding)).toBe(true);
    expect(data.data[0].embedding.length).toBe(1536); // text-embedding-3-small dimension
  }, 30000); // 30s timeout for API call
});
