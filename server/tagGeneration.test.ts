import { describe, expect, it } from "vitest";
import { generateTags } from "./documentProcessor";

describe("Tag Generation", () => {
  it("should generate tags from document content", async () => {
    const sampleContent = `
      Apartamento de 3 dormitórios localizado no bairro Jardins em São Paulo.
      O imóvel possui 120m² de área útil, com 2 vagas de garagem.
      Condomínio com piscina, academia e salão de festas.
      Valor: R$ 850.000,00
    `;

    const tags = await generateTags(sampleContent, 5);
    
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(5);
    
    // Tags should be strings
    tags.forEach(tag => {
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThan(0);
    });
  }, 30000); // 30 second timeout for API call

  it("should handle empty content gracefully", async () => {
    const tags = await generateTags("", 5);
    
    expect(Array.isArray(tags)).toBe(true);
    // Should return empty array or handle gracefully
  }, 30000);

  it("should respect maxTags parameter", async () => {
    const sampleContent = `
      Este é um documento de teste com várias informações sobre diferentes tópicos.
      Inclui informações sobre tecnologia, negócios, vendas e marketing.
    `;

    const tags = await generateTags(sampleContent, 3);
    
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeLessThanOrEqual(3);
  }, 30000);

  it("should truncate long content", async () => {
    // Create very long content (> 3000 chars)
    const longContent = "Parágrafo de teste. ".repeat(200);
    
    const tags = await generateTags(longContent, 5);
    
    expect(Array.isArray(tags)).toBe(true);
    // Should not throw error even with long content
  }, 30000);
});
