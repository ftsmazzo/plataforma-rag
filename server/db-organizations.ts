import { eq, and, desc, or, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { organizations, users, documents, documentChunks, embeddings, Organization, InsertOrganization } from "../drizzle/schema";

// ==================== Organizations ====================

export async function createOrganization(org: InsertOrganization): Promise<Organization> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(organizations).values(org);
  
  const result = await db.select().from(organizations).where(eq(organizations.id, inserted.insertId)).limit(1);
  if (!result[0]) throw new Error("Failed to retrieve inserted organization");
  
  return result[0];
}

export async function getOrganizationById(id: number): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return result[0];
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function getActiveOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(organizations).where(eq(organizations.isActive, 1)).orderBy(desc(organizations.createdAt));
}

export async function updateOrganization(
  id: number,
  updates: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(organizations).set(updates).where(eq(organizations.id, id));
}

export async function deactivateOrganization(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(organizations).set({ isActive: 0 }).where(eq(organizations.id, id));
}

export async function activateOrganization(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(organizations).set({ isActive: 1 }).where(eq(organizations.id, id));
}

// ==================== Organization Statistics ====================

export async function getOrganizationStats(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [orgDocs, orgChunks, orgEmbeddings, orgUsers] = await Promise.all([
    db.select().from(documents).where(eq(documents.organizationId, organizationId)),
    db.select().from(documentChunks).where(eq(documentChunks.organizationId, organizationId)),
    db.select().from(embeddings).where(eq(embeddings.organizationId, organizationId)),
    db.select().from(users).where(eq(users.organizationId, organizationId)),
  ]);

  return {
    totalDocuments: orgDocs.length,
    totalChunks: orgChunks.length,
    totalEmbeddings: orgEmbeddings.length,
    totalUsers: orgUsers.length,
    completedDocuments: orgDocs.filter(d => d.status === "completed").length,
    failedDocuments: orgDocs.filter(d => d.status === "failed").length,
  };
}

// ==================== User-Organization Management ====================

export async function assignUserToOrganization(userId: number, organizationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ organizationId }).where(eq(users.id, userId));
}

export async function getOrganizationUsers(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(users).where(eq(users.organizationId, organizationId)).orderBy(desc(users.createdAt));
}

export async function getUsersWithoutOrganization() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(users).where(isNull(users.organizationId)).orderBy(desc(users.createdAt));
}
