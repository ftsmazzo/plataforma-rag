import { describe, it, expect, beforeAll } from "vitest";
import {
  createOrganization,
  getOrganizationById,
  getAllOrganizations,
  getOrganizationStats,
  assignUserToOrganization,
} from "./db-organizations";
import {
  createDocument,
  getUserDocuments,
  getDocumentById,
  createChunk,
  createEmbedding,
  getAllUserEmbeddings,
  getChunksByIds,
} from "./db";

describe("Multi-tenant Isolation Tests", () => {
  let org1Id: number;
  let org2Id: number;
  const mockUserId1 = 999;
  const mockUserId2 = 998;

  beforeAll(async () => {
    // Criar duas organizações de teste
    const org1 = await createOrganization({
      name: "Test Organization 1",
      slug: "test-org-1",
      description: "First test organization",
    });
    org1Id = org1.id;

    const org2 = await createOrganization({
      name: "Test Organization 2",
      slug: "test-org-2",
      description: "Second test organization",
    });
    org2Id = org2.id;
  });

  describe("Organization Management", () => {
    it("should create organizations successfully", async () => {
      const org = await getOrganizationById(org1Id);
      expect(org).toBeDefined();
      expect(org?.name).toBe("Test Organization 1");
      expect(org?.slug).toBe("test-org-1");
      expect(org?.isActive).toBe(1);
    });

    it("should list all organizations", async () => {
      const orgs = await getAllOrganizations();
      expect(orgs.length).toBeGreaterThanOrEqual(2);
      const testOrgs = orgs.filter(o => o.slug.startsWith("test-org-"));
      expect(testOrgs.length).toBeGreaterThanOrEqual(2);
    });

    it("should get organization stats", async () => {
      const stats = await getOrganizationStats(org1Id);
      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
      expect(stats.totalChunks).toBeGreaterThanOrEqual(0);
      expect(stats.totalEmbeddings).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Document Isolation", () => {
    it("should isolate documents by organization", async () => {
      // Criar documento na organização 1
      const doc1 = await createDocument({
        userId: mockUserId1,
        organizationId: org1Id,
        filename: "test-doc-org1.pdf",
        originalFilename: "test-doc-org1.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/doc1.pdf",
        s3Url: "https://s3.example.com/test/doc1.pdf",
        status: "completed",
      });

      // Criar documento na organização 2
      const doc2 = await createDocument({
        userId: mockUserId2,
        organizationId: org2Id,
        filename: "test-doc-org2.pdf",
        originalFilename: "test-doc-org2.pdf",
        fileType: "pdf",
        fileSize: 2048,
        s3Key: "test/doc2.pdf",
        s3Url: "https://s3.example.com/test/doc2.pdf",
        status: "completed",
      });

      // Verificar que documentos são isolados por organização
      const org1Docs = await getUserDocuments(mockUserId1, org1Id);
      const org2Docs = await getUserDocuments(mockUserId2, org2Id);

      expect(org1Docs.some(d => d.id === doc1.id)).toBe(true);
      expect(org1Docs.some(d => d.id === doc2.id)).toBe(false);
      
      expect(org2Docs.some(d => d.id === doc2.id)).toBe(true);
      expect(org2Docs.some(d => d.id === doc1.id)).toBe(false);
    });

    it("should not allow access to documents from other organizations", async () => {
      // Criar documento na org1
      const doc = await createDocument({
        userId: mockUserId1,
        organizationId: org1Id,
        filename: "private-doc.pdf",
        originalFilename: "private-doc.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/private.pdf",
        s3Url: "https://s3.example.com/test/private.pdf",
        status: "completed",
      });

      // Tentar acessar com org2
      const result = await getDocumentById(doc.id, mockUserId1, org2Id);
      expect(result).toBeUndefined();

      // Acessar com org1 correta deve funcionar
      const correctResult = await getDocumentById(doc.id, mockUserId1, org1Id);
      expect(correctResult).toBeDefined();
      expect(correctResult?.id).toBe(doc.id);
    });
  });

  describe("Chunk and Embedding Isolation", () => {
    it("should isolate chunks by organization", async () => {
      // Criar documento e chunk na org1
      const doc = await createDocument({
        userId: mockUserId1,
        organizationId: org1Id,
        filename: "chunk-test.pdf",
        originalFilename: "chunk-test.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/chunk.pdf",
        s3Url: "https://s3.example.com/test/chunk.pdf",
        status: "completed",
      });

      const chunk1 = await createChunk({
        documentId: doc.id,
        userId: mockUserId1,
        organizationId: org1Id,
        chunkIndex: 0,
        content: "Test content for organization 1",
        metadata: JSON.stringify({ page: 1 }),
        tokenCount: 10,
      });

      // Criar chunk na org2
      const doc2 = await createDocument({
        userId: mockUserId2,
        organizationId: org2Id,
        filename: "chunk-test2.pdf",
        originalFilename: "chunk-test2.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/chunk2.pdf",
        s3Url: "https://s3.example.com/test/chunk2.pdf",
        status: "completed",
      });

      const chunk2 = await createChunk({
        documentId: doc2.id,
        userId: mockUserId2,
        organizationId: org2Id,
        chunkIndex: 0,
        content: "Test content for organization 2",
        metadata: JSON.stringify({ page: 1 }),
        tokenCount: 10,
      });

      // Verificar isolamento de chunks
      const org1Chunks = await getChunksByIds([chunk1.id, chunk2.id], mockUserId1, org1Id);
      const org2Chunks = await getChunksByIds([chunk1.id, chunk2.id], mockUserId2, org2Id);

      expect(org1Chunks.some(c => c.id === chunk1.id)).toBe(true);
      expect(org1Chunks.some(c => c.id === chunk2.id)).toBe(false);
      
      expect(org2Chunks.some(c => c.id === chunk2.id)).toBe(true);
      expect(org2Chunks.some(c => c.id === chunk1.id)).toBe(false);
    });

    it("should isolate embeddings by organization", async () => {
      // Criar documento, chunk e embedding na org1
      const doc = await createDocument({
        userId: mockUserId1,
        organizationId: org1Id,
        filename: "embedding-test.pdf",
        originalFilename: "embedding-test.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/embedding.pdf",
        s3Url: "https://s3.example.com/test/embedding.pdf",
        status: "completed",
      });

      const chunk = await createChunk({
        documentId: doc.id,
        userId: mockUserId1,
        organizationId: org1Id,
        chunkIndex: 0,
        content: "Test embedding content",
        metadata: JSON.stringify({ page: 1 }),
        tokenCount: 10,
      });

      const embedding1 = await createEmbedding({
        chunkId: chunk.id,
        documentId: doc.id,
        userId: mockUserId1,
        organizationId: org1Id,
        embedding: JSON.stringify([0.1, 0.2, 0.3]),
        embeddingModel: "test-model",
      });

      // Verificar que embeddings são isolados
      const org1Embeddings = await getAllUserEmbeddings(mockUserId1, org1Id);
      const org2Embeddings = await getAllUserEmbeddings(mockUserId2, org2Id);

      expect(org1Embeddings.some(e => e.id === embedding1.id)).toBe(true);
      expect(org2Embeddings.some(e => e.id === embedding1.id)).toBe(false);
    });
  });

  describe("Cross-Organization Access Prevention", () => {
    it("should prevent users from accessing data across organizations", async () => {
      // Criar documento na org1
      const doc = await createDocument({
        userId: mockUserId1,
        organizationId: org1Id,
        filename: "cross-org-test.pdf",
        originalFilename: "cross-org-test.pdf",
        fileType: "pdf",
        fileSize: 1024,
        s3Key: "test/cross.pdf",
        s3Url: "https://s3.example.com/test/cross.pdf",
        status: "completed",
      });

      // Tentar buscar documentos da org1 com filtro da org2
      const docs = await getUserDocuments(mockUserId1, org2Id);
      expect(docs.some(d => d.id === doc.id)).toBe(false);
    });

    it("should maintain data integrity across organizations", async () => {
      const stats1 = await getOrganizationStats(org1Id);
      const stats2 = await getOrganizationStats(org2Id);

      // Estatísticas devem ser independentes
      expect(stats1.totalDocuments).not.toBe(stats2.totalDocuments);
      
      // Cada organização deve ter seus próprios dados
      expect(stats1.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats2.totalDocuments).toBeGreaterThanOrEqual(0);
    });
  });
});
