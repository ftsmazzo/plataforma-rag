import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "../drizzle/schema";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL!;
const pool = new Pool({
  connectionString: DATABASE_URL,
});
const db = drizzle(pool);

/**
 * Generate a new API key (32 characters)
 */
export function generateApiKey(): string {
  return `sk_${nanoid(40)}`; // sk_ prefix + 40 random characters
}

/**
 * Create a new API key
 */
export async function createApiKey(data: {
  name: string;
  userId: number;
  organizationId: number;
  rateLimit?: number;
}) {
  const key = generateApiKey();
  
  const result = await db.insert(apiKeys).values({
    ...data,
    key,
  }).returning();
  
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, result[0].id))
    .limit(1);
  
  return apiKey;
}

/**
 * Get all API keys for a user/organization
 */
export async function getUserApiKeys(userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(apiKeys.userId, userId), eq(apiKeys.organizationId, organizationId))
    : eq(apiKeys.userId, userId);

  return await db
    .select()
    .from(apiKeys)
    .where(conditions)
    .orderBy(apiKeys.createdAt);
}

/**
 * Validate API key and return associated user/organization
 */
export async function validateApiKey(key: string) {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)))
    .limit(1);
  
  if (!apiKey) {
    return null;
  }
  
  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));
  
  return {
    apiKeyId: apiKey.id,
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    rateLimit: apiKey.rateLimit,
  };
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), eq(apiKeys.organizationId, organizationId))
    : and(eq(apiKeys.id, id), eq(apiKeys.userId, userId));

  await db.update(apiKeys).set({ isActive: false }).where(conditions);
}

/**
 * Activate an API key
 */
export async function activateApiKey(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), eq(apiKeys.organizationId, organizationId))
    : and(eq(apiKeys.id, id), eq(apiKeys.userId, userId));

  await db.update(apiKeys).set({ isActive: true }).where(conditions);
}

/**
 * Delete an API key
 */
export async function deleteApiKey(id: number, userId: number, organizationId?: number) {
  const conditions = organizationId
    ? and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), eq(apiKeys.organizationId, organizationId))
    : and(eq(apiKeys.id, id), eq(apiKeys.userId, userId));

  await db.delete(apiKeys).where(conditions);
}
