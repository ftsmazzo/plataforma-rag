import { describe, it, expect, beforeAll } from "vitest";
import { getEmbeddingsByKnowledgeBase, getChunksByIdsForKnowledgeBase, getAllUsersInOrganization, getUserKnowledgeBases } from "./db";

describe("API Context Fix", () => {
  const testOrgId = 1;
  const testKbId = 1;

  it("should fetch embeddings by knowledge base ID", async () => {
    const embeddings = await getEmbeddingsByKnowledgeBase(testKbId, testOrgId);
    
    // Should return array (may be empty if no data)
    expect(Array.isArray(embeddings)).toBe(true);
    
    // If there are embeddings, they should all belong to the correct KB
    if (embeddings.length > 0) {
      embeddings.forEach(emb => {
        expect(emb.knowledgeBaseId).toBe(testKbId);
        expect(emb.organizationId).toBe(testOrgId);
      });
    }
  });

  it("should fetch chunks by IDs for knowledge base", async () => {
    // Test with empty array
    const emptyChunks = await getChunksByIdsForKnowledgeBase([], testOrgId);
    expect(emptyChunks).toEqual([]);
    
    // Test with non-existent IDs
    const chunks = await getChunksByIdsForKnowledgeBase([99999], testOrgId);
    expect(Array.isArray(chunks)).toBe(true);
  });
});

describe("Admin User Management", () => {
  const testOrgId = 1;

  it("should list all users in organization", async () => {
    const users = await getAllUsersInOrganization(testOrgId);
    
    expect(Array.isArray(users)).toBe(true);
    
    // All users should belong to the organization
    users.forEach(user => {
      expect(user.organizationId).toBe(testOrgId);
    });
  });

  it("should get knowledge bases for a user", async () => {
    const users = await getAllUsersInOrganization(testOrgId);
    
    if (users.length > 0) {
      const firstUser = users[0];
      const kbs = await getUserKnowledgeBases(firstUser.id, testOrgId);
      
      expect(Array.isArray(kbs)).toBe(true);
      
      // All KBs should belong to the user and organization
      kbs.forEach(kb => {
        expect(kb.userId).toBe(firstUser.id);
        expect(kb.organizationId).toBe(testOrgId);
      });
    }
  });
});
