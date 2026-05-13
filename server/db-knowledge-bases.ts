import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc } from "drizzle-orm";
import { knowledgeBases, documents, documentChunks, embeddings } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const pool = new Pool({
  connectionString: DATABASE_URL,
});
const db = drizzle(pool);

/**
 * Create a new knowledge base
 */
export async function createKnowledgeBase(data: {
  name: string;
  description?: string;
  webhookUrl?: string;
  userId: number;
  organizationId: number;
}) {
  const result = await db.insert(knowledgeBases).values(data).returning();
  const [knowledgeBase] = await db
    .select()
    .from(knowledgeBases)
    .where(eq(knowledgeBases.id, result[0].id))
    .limit(1);
  return knowledgeBase;
}

/**
 * Get knowledge base by ID
 */
export async function getKnowledgeBaseById(id: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(knowledgeBases.id, id), eq(knowledgeBases.organizationId, organizationId))
    : eq(knowledgeBases.id, id);

  const [knowledgeBase] = await db
    .select()
    .from(knowledgeBases)
    .where(conditions)
    .limit(1);
  return knowledgeBase;
}

/**
 * Get all knowledge bases for a user/organization
 */
export async function getUserKnowledgeBases(userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(knowledgeBases.userId, userId), eq(knowledgeBases.organizationId, organizationId))
    : eq(knowledgeBases.userId, userId);

  return await db
    .select()
    .from(knowledgeBases)
    .where(conditions)
    .orderBy(desc(knowledgeBases.createdAt));
}

/**
 * Get all active knowledge bases for an organization
 */
export async function getActiveKnowledgeBases(organizationId: number) {
  return await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.organizationId, organizationId),
        eq(knowledgeBases.isActive, true)
      )
    )
    .orderBy(desc(knowledgeBases.createdAt));
}

/**
 * Update knowledge base
 */
export async function updateKnowledgeBase(
  id: number,
  userId: number,
  updates: {
    name?: string;
    description?: string;
  },
  organizationId?: number
) {
  const conditions = organizationId
    ? and(
        eq(knowledgeBases.id, id),
        eq(knowledgeBases.userId, userId),
        eq(knowledgeBases.organizationId, organizationId)
      )
    : and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId));

  await db.update(knowledgeBases).set(updates).where(conditions);
}

/**
 * Delete knowledge base (soft delete by setting isActive = 0)
 */
export async function deactivateKnowledgeBase(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(
        eq(knowledgeBases.id, id),
        eq(knowledgeBases.userId, userId),
        eq(knowledgeBases.organizationId, organizationId)
      )
    : and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId));

  await db.update(knowledgeBases).set({ isActive: false }).where(conditions);
}

/**
 * Activate knowledge base
 */
export async function activateKnowledgeBase(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(
        eq(knowledgeBases.id, id),
        eq(knowledgeBases.userId, userId),
        eq(knowledgeBases.organizationId, organizationId)
      )
    : and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId));

  await db.update(knowledgeBases).set({ isActive: true }).where(conditions);
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats(id: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(documents.knowledgeBaseId, id), eq(documents.organizationId, organizationId))
    : eq(documents.knowledgeBaseId, id);

  const docs = await db.select().from(documents).where(conditions);

  const chunkConditions = organizationId
    ? and(eq(documentChunks.knowledgeBaseId, id), eq(documentChunks.organizationId, organizationId))
    : eq(documentChunks.knowledgeBaseId, id);

  const chunks = await db.select().from(documentChunks).where(chunkConditions);

  const embeddingConditions = organizationId
    ? and(eq(embeddings.knowledgeBaseId, id), eq(embeddings.organizationId, organizationId))
    : eq(embeddings.knowledgeBaseId, id);

  const embs = await db.select().from(embeddings).where(embeddingConditions);

  return {
    totalDocuments: docs.length,
    totalChunks: chunks.length,
    totalEmbeddings: embs.length,
  };
}

/**
 * Get or create default knowledge base for user
 * Used when user uploads without selecting a base
 */
export async function getOrCreateDefaultKnowledgeBase(userId: number, organizationId: number) {
  // Try to find existing default base
  const existing = await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.userId, userId),
        eq(knowledgeBases.organizationId, organizationId),
        eq(knowledgeBases.name, "Base Principal")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default base
  return await createKnowledgeBase({
    name: "Base Principal",
    description: "Base de conhecimento padrão",
    userId,
    organizationId,
  });
}

/**
 * Delete knowledge base (hard delete)
 */
export async function deleteKnowledgeBase(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId), eq(knowledgeBases.organizationId, organizationId))
    : and(eq(knowledgeBases.id, id), eq(knowledgeBases.userId, userId));

  await db.delete(knowledgeBases).where(conditions);
}
