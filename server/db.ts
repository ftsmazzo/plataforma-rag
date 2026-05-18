import { desc, eq, and, sql, inArray, gte, lte, or, like, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, User, users, documents, InsertDocument, Document, documentChunks, InsertDocumentChunk, DocumentChunk, embeddings, InsertEmbedding, Embedding, documentVersions, feedback, knowledgeBases, systemSettings, organizations, apiKeys, apiLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

const { Pool } = pg;
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Add connection timeout and retry logic
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      });
      
      // Test connection
      await _pool.query('SELECT 1');
      
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully");
    } catch (error: any) {
      console.error("[Database] Failed to connect:", error);
      console.error("[Database] Connection error details:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    console.log("[Database] Searching for user with email:", email);
    console.log("[Database] Email type:", typeof email);
    console.log("[Database] Email length:", email.length);
    
    // Try case-insensitive search first
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    
    console.log("[Database] Query result:", {
      found: result.length > 0,
      resultCount: result.length,
      userId: result[0]?.id,
      userEmail: result[0]?.email,
      userEmailType: typeof result[0]?.email,
      userEmailLength: result[0]?.email?.length,
    });
    
    if (result.length === 0) {
      // Try to find any user to see if query works
      const allUsers = await db.select({ email: users.email }).from(users).limit(5);
      console.log("[Database] Sample emails in database:", allUsers.map(u => u.email));
      
      // Try exact match with different case
      const caseInsensitiveResult = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email.trim()})`)
        .limit(1);
      
      console.log("[Database] Case-insensitive search result:", {
        found: caseInsensitiveResult.length > 0,
        userEmail: caseInsensitiveResult[0]?.email,
      });
      
      if (caseInsensitiveResult.length > 0) {
        return caseInsensitiveResult[0];
      }
    }
    
    return result.length > 0 ? result[0] : undefined;
  } catch (error: any) {
    console.error("[Database] Failed to get user by email:", error);
    console.error("[Database] Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(userData: {
  email: string;
  password: string; // Already hashed
  name?: string;
  role?: "user" | "admin";
  organizationId?: number;
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already exists
  const existing = await getUserByEmail(userData.email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const values: InsertUser = {
    email: userData.email,
    password: userData.password,
    name: userData.name || null,
    role: userData.role || "user",
    organizationId: userData.organizationId || 1, // Default to organization 1
  };

  const result = await db.insert(users).values(values).returning();
  if (!result[0]) {
    throw new Error("Failed to create user");
  }
  return result[0];
}

// Document operations
export async function createDocument(doc: InsertDocument): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(doc).returning();
  if (!result[0]) throw new Error("Failed to insert document");
  
  return result[0];
}

export async function updateDocumentStatus(
  documentId: number,
  status: "uploading" | "processing" | "completed" | "failed",
  errorMessage?: string,
  totalChunks?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
  if (totalChunks !== undefined) updateData.totalChunks = totalChunks;

  await db.update(documents).set(updateData).where(eq(documents.id, documentId));
}

export async function getUserDocuments(userId: number, organizationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { knowledgeBases } = await import("../drizzle/schema");
  const conditions = [eq(documents.userId, userId)];
  if (organizationId !== undefined) {
    conditions.push(eq(documents.organizationId, organizationId));
  }

  return await db
    .select({
      id: documents.id,
      userId: documents.userId,
      organizationId: documents.organizationId,
      knowledgeBaseId: documents.knowledgeBaseId,
      filename: documents.filename,
      originalFilename: documents.originalFilename,
      fileType: documents.fileType,
      fileSize: documents.fileSize,
      storageKey: documents.storageKey,
      storageUrl: documents.storageUrl,
      status: documents.status,
      errorMessage: documents.errorMessage,
      totalChunks: documents.totalChunks,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      knowledgeBaseName: knowledgeBases.name,
    })
    .from(documents)
    .leftJoin(knowledgeBases, eq(documents.knowledgeBaseId, knowledgeBases.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(documentId: number, userId: number, organizationId?: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(documents.id, documentId), eq(documents.userId, userId)];
  if (organizationId !== undefined) {
    conditions.push(eq(documents.organizationId, organizationId));
  }

  const result = await db.select().from(documents).where(and(...conditions)).limit(1);

  return result[0];
}

export async function deleteDocument(documentId: number, userId: number, organizationId?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const docConditions = [eq(documents.id, documentId), eq(documents.userId, userId)];
  const relatedConditions = [eq(embeddings.documentId, documentId), eq(embeddings.userId, userId)];
  
  if (organizationId !== undefined) {
    docConditions.push(eq(documents.organizationId, organizationId));
    relatedConditions.push(eq(embeddings.organizationId, organizationId));
  }

  await db.delete(embeddings).where(and(...relatedConditions));

  const chunkConditions = [eq(documentChunks.documentId, documentId), eq(documentChunks.userId, userId)];
  if (organizationId !== undefined) {
    chunkConditions.push(eq(documentChunks.organizationId, organizationId));
  }
  await db.delete(documentChunks).where(and(...chunkConditions));

  await db.delete(documents).where(and(...docConditions));
}

export async function updateDocumentMetadata(
  documentId: number,
  userId: number,
  updates: { tags?: string; description?: string; metadata?: string },
  organizationId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(documents.id, documentId), eq(documents.userId, userId)];
  if (organizationId !== undefined) {
    conditions.push(eq(documents.organizationId, organizationId));
  }

  await db.update(documents).set(updates).where(and(...conditions));
}

// Chunk operations
export async function createChunk(chunk: InsertDocumentChunk): Promise<DocumentChunk> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documentChunks).values(chunk).returning();
  if (!result[0]) throw new Error("Failed to insert chunk");
  
  return result[0];
}

export async function getDocumentChunks(documentId: number, userId: number): Promise<DocumentChunk[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(documentChunks).where(
    and(eq(documentChunks.documentId, documentId), eq(documentChunks.userId, userId))
  );
}

// Embedding operations
export async function createEmbedding(emb: InsertEmbedding): Promise<Embedding> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(embeddings).values(emb).returning();
  if (!result[0]) throw new Error("Failed to insert embedding");
  
  return result[0];
}

export async function getAllUserEmbeddings(userId: number, organizationId?: number): Promise<Embedding[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(embeddings.userId, userId)];
  if (organizationId !== undefined) {
    conditions.push(eq(embeddings.organizationId, organizationId));
  }

  return await db.select().from(embeddings).where(and(...conditions));
}

export async function getEmbeddingsByKnowledgeBase(kbId: number, organizationId: number): Promise<Embedding[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(embeddings).where(
    and(
      eq(embeddings.knowledgeBaseId, kbId),
      eq(embeddings.organizationId, organizationId)
    )
  );
}

export async function getChunksByIds(chunkIds: number[], userId: number, organizationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (chunkIds.length === 0) return [];

  const conditions = [eq(documentChunks.userId, userId)];
  if (organizationId !== undefined) {
    conditions.push(eq(documentChunks.organizationId, organizationId));
  }

  const chunks = await db
    .select({
      id: documentChunks.id,
      createdAt: documentChunks.createdAt,
      content: documentChunks.content,
      metadata: documentChunks.metadata,
      documentId: documentChunks.documentId,
      userId: documentChunks.userId,
      chunkIndex: documentChunks.chunkIndex,
      tokenCount: documentChunks.tokenCount,
      documentName: documents.originalFilename,
      organizationId: documentChunks.organizationId,
    })
    .from(documentChunks)
    .leftJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(...conditions));
  
  return chunks.filter(chunk => chunkIds.includes(chunk.id));
}

export async function getChunksByIdsForKnowledgeBase(chunkIds: number[], organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (chunkIds.length === 0) return [];

  const chunks = await db
    .select({
      id: documentChunks.id,
      createdAt: documentChunks.createdAt,
      content: documentChunks.content,
      metadata: documentChunks.metadata,
      documentId: documentChunks.documentId,
      userId: documentChunks.userId,
      chunkIndex: documentChunks.chunkIndex,
      tokenCount: documentChunks.tokenCount,
      documentName: documents.originalFilename,
      organizationId: documentChunks.organizationId,
    })
    .from(documentChunks)
    .leftJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(eq(documentChunks.organizationId, organizationId));
  
  return chunks.filter(chunk => chunkIds.includes(chunk.id));
}

// Admin queries
export async function getAllDocuments(options?: {
  limit?: number;
  offset?: number;
  userId?: number;
  status?: string;
  fileType?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select({
    document: documents,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id));

  // Apply filters
  const conditions = [];
  if (options?.userId) {
    conditions.push(eq(documents.userId, options.userId));
  }
  if (options?.status) {
    conditions.push(eq(documents.status, options.status as any));
  }
  if (options?.fileType) {
    conditions.push(eq(documents.fileType, options.fileType));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Order by most recent
  query = query.orderBy(desc(documents.createdAt)) as any;

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as any;
  }

  return await query;
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const { sql: rawSql } = await import("drizzle-orm");

  const [totalDocs] = await db.select({ count: rawSql<number>`count(*)` }).from(documents);
  const [totalUsers] = await db.select({ count: rawSql<number>`count(*)` }).from(users);
  const [totalChunks] = await db.select({ count: rawSql<number>`count(*)` }).from(documentChunks);
  const [totalEmbeddings] = await db.select({ count: rawSql<number>`count(*)` }).from(embeddings);

  // Documents by status
  const docsByStatus = await db.select({
    status: documents.status,
    count: rawSql<number>`count(*)`
  })
    .from(documents)
    .groupBy(documents.status);

  // Documents by type
  const docsByType = await db.select({
    fileType: documents.fileType,
    count: rawSql<number>`count(*)`
  })
    .from(documents)
    .groupBy(documents.fileType);

  return {
    totalDocuments: totalDocs?.count || 0,
    totalUsers: totalUsers?.count || 0,
    totalChunks: totalChunks?.count || 0,
    totalEmbeddings: totalEmbeddings?.count || 0,
    documentsByStatus: docsByStatus,
    documentsByType: docsByType,
  };
}

export async function deleteDocumentAsAdmin(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete in order: embeddings -> chunks -> document
  await db.delete(embeddings).where(eq(embeddings.documentId, documentId));
  await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));
  await db.delete(documents).where(eq(documents.id, documentId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// ==================== Document Versioning ====================

export async function createDocumentVersion(version: {
  documentId: number;
  userId: number;
  organizationId: number;
  filename: string;
  storageKey: string;
  storageUrl: string;
  fileSize: number;
  tags?: string;
  description?: string;
  changeDescription?: string;
  totalChunks: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");


  
  // Get current version number
  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, version.documentId))
    .orderBy(desc(documentVersions.versionNumber));
  
  const versionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

  const [newVersion] = await db.insert(documentVersions).values({
    ...version,
    versionNumber,
  });

  return newVersion;
}

export async function getDocumentVersions(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];



  return await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.userId, userId)
      )
    )
    .orderBy(desc(documentVersions.versionNumber));
}

export async function getDocumentVersion(versionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;



  const [version] = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.id, versionId),
        eq(documentVersions.userId, userId)
      )
    )
    .limit(1);

  return version;
}

// ==================== Feedback System ====================

export async function createFeedback(feedbackData: {
  userId: number;
  type: "bug" | "feature" | "improvement" | "other";
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");



  const [newFeedback] = await db.insert(feedback).values({
    ...feedbackData,
    priority: feedbackData.priority || "medium",
  });

  return newFeedback;
}

export async function getUserFeedback(userId: number) {
  const db = await getDb();
  if (!db) return [];



  return await db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, userId))
    .orderBy(desc(feedback.createdAt));
}

export async function getAllFeedback() {
  const db = await getDb();
  if (!db) return [];



  return await db
    .select({
      id: feedback.id,
      userId: feedback.userId,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      status: feedback.status,
      priority: feedback.priority,
      adminResponse: feedback.adminResponse,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt));
}

export async function updateFeedbackStatus(
  feedbackId: number,
  status: "open" | "in_progress" | "resolved" | "closed",
  adminResponse?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");



  const updateData: any = { status };
  if (adminResponse !== undefined) {
    updateData.adminResponse = adminResponse;
  }

  await db
    .update(feedback)
    .set(updateData)
    .where(eq(feedback.id, feedbackId));
}

// ==================== Analytics ====================

export async function getUploadsByPeriod(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const { sql: rawSql } = await import("drizzle-orm");

  const results = await db.select({
    date: rawSql<string>`DATE(createdAt)`,
    count: rawSql<number>`count(*)`
  })
    .from(documents)
    .where(sql`createdAt >= NOW() - INTERVAL '${days} days'`)
    .groupBy(rawSql`DATE(createdAt)`)
    .orderBy(rawSql`DATE(createdAt) ASC`);

  return results;
}

export async function getUserActivity() {
  const db = await getDb();
  if (!db) return [];

  const { sql: rawSql } = await import("drizzle-orm");

  const results = await db.select({
    userId: documents.userId,
    userName: users.name,
    userEmail: users.email,
    documentCount: rawSql<number>`count(*)`,
    totalSize: rawSql<number>`sum(${documents.fileSize})`,
    lastUpload: rawSql<Date>`max(${documents.createdAt})`
  })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id))
    .groupBy(documents.userId, users.name, users.email)
    .orderBy(rawSql`count(*) DESC`);

  return results;
}

// ==================== Notifications ====================

export async function createNotification(notification: {
  userId: number;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const { notifications } = await import("../drizzle/schema");

  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const { notifications } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, 0));
  }

  const results = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return results;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const { notifications } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");

  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

  return true;
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;

  const { notifications } = await import("../drizzle/schema");

  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.userId, userId));

  return true;
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { notifications } = await import("../drizzle/schema");
  const { sql: rawSql, and } = await import("drizzle-orm");

  const result = await db
    .select({ count: rawSql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));

  return result[0]?.count || 0;
}

// Helper to notify all admins
export async function notifyAllAdmins(notification: {
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}) {
  const db = await getDb();
  if (!db) return;

  // Get all admin users
  const admins = await db.select().from(users).where(eq(users.role, "admin"));

  // Create notification for each admin
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      ...notification,
    });
  }
}


/**
 * System Settings Functions
 */

export async function getSystemSettings(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return null;

  const { systemSettings } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");

  const settings = await db
    .select()
    .from(systemSettings)
    .where(and(eq(systemSettings.userId, userId), eq(systemSettings.organizationId, organizationId)))
    .limit(1);

  return settings[0] || null;
}

export async function createSystemSettings(data: {
  userId: number;
  organizationId: number;
  llmProvider: string;
  ollamaBaseUrl?: string;
  ollamaEmbeddingModel?: string;
  ollamaChatModel?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { systemSettings } = await import("../drizzle/schema");

  const result = await db.insert(systemSettings).values(data);
  return result[0];
}

export async function updateSystemSettings(
  userId: number,
  organizationId: number,
  data: {
    llmProvider?: string;
    ollamaBaseUrl?: string;
    ollamaEmbeddingModel?: string;
    ollamaChatModel?: string;
    lastTestedAt?: Date;
    lastTestStatus?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { systemSettings } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");

  await db
    .update(systemSettings)
    .set(data)
    .where(and(eq(systemSettings.userId, userId), eq(systemSettings.organizationId, organizationId)));

  return true;
}

export async function getOrCreateSystemSettings(userId: number, organizationId: number) {
  let settings = await getSystemSettings(userId, organizationId);
  
  if (!settings) {
    // Create default settings
    await createSystemSettings({
      userId,
      organizationId,
      llmProvider: "openai",
      ollamaBaseUrl: "https://llm.fabricadosdados.online",
      ollamaEmbeddingModel: "nomic-embed-text",
      ollamaChatModel: "llama3.2:1b",
    });
    settings = await getSystemSettings(userId, organizationId);
  }
  
  return settings;
}

// Admin: User Management
export async function getAllUsersInOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      organizationId: users.organizationId,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));
}

export async function deleteUserAndData(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete in order: embeddings → chunks → documents → knowledge bases → user
  
  // 1. Delete embeddings
  await db.delete(embeddings).where(
    and(
      eq(embeddings.userId, userId),
      eq(embeddings.organizationId, organizationId)
    )
  );

  // 2. Delete chunks
  await db.delete(documentChunks).where(
    and(
      eq(documentChunks.userId, userId),
      eq(documentChunks.organizationId, organizationId)
    )
  );

  // 3. Delete documents
  await db.delete(documents).where(
    and(
      eq(documents.userId, userId),
      eq(documents.organizationId, organizationId)
    )
  );

  // 4. Delete knowledge bases
  await db.delete(knowledgeBases).where(
    and(
      eq(knowledgeBases.userId, userId),
      eq(knowledgeBases.organizationId, organizationId)
    )
  );

  // 5. Delete system settings
  await db.delete(systemSettings).where(
    and(
      eq(systemSettings.userId, userId),
      eq(systemSettings.organizationId, organizationId)
    )
  );

  // 6. Delete user
  await db.delete(users).where(
    and(
      eq(users.id, userId),
      eq(users.organizationId, organizationId)
    )
  );

  return { success: true };
}

export async function getUserKnowledgeBases(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.userId, userId),
        eq(knowledgeBases.organizationId, organizationId)
      )
    )
    .orderBy(desc(knowledgeBases.createdAt));
}

export async function adminDeleteKnowledgeBase(kbId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete in order: embeddings → chunks → documents → knowledge base
  
  // 1. Delete embeddings
  await db.delete(embeddings).where(
    and(
      eq(embeddings.knowledgeBaseId, kbId),
      eq(embeddings.organizationId, organizationId)
    )
  );

  // 2. Get all documents in this KB
  const kbDocs = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.knowledgeBaseId, kbId),
        eq(documents.organizationId, organizationId)
      )
    );

  const docIds = kbDocs.map(d => d.id);

  // 3. Delete chunks
  if (docIds.length > 0) {
    await db.delete(documentChunks).where(
      and(
        eq(documentChunks.organizationId, organizationId),
        // Filter by documentId in docIds
      )
    );
  }

  // 4. Delete documents
  await db.delete(documents).where(
    and(
      eq(documents.knowledgeBaseId, kbId),
      eq(documents.organizationId, organizationId)
    )
  );

  // 5. Delete knowledge base
  await db.delete(knowledgeBases).where(
    and(
      eq(knowledgeBases.id, kbId),
      eq(knowledgeBases.organizationId, organizationId)
    )
  );

  return { success: true };
}

function toInt(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** Painel admin: contagens gerais das tabelas */
export async function getDatabasePanelStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [
    [orgCount],
    [userCount],
    [kbCount],
    [keyCount],
    [docCount],
    [chunkCount],
    [embCount],
    [logCount],
  ] = await Promise.all([
    db.select({ count: count() }).from(organizations),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(knowledgeBases),
    db.select({ count: count() }).from(apiKeys),
    db.select({ count: count() }).from(documents),
    db.select({ count: count() }).from(documentChunks),
    db.select({ count: count() }).from(embeddings),
    db.select({ count: count() }).from(apiLogs),
  ]);

  return {
    organizations: toInt(orgCount?.count),
    users: toInt(userCount?.count),
    knowledgeBases: toInt(kbCount?.count),
    apiKeys: toInt(keyCount?.count),
    documents: toInt(docCount?.count),
    chunks: toInt(chunkCount?.count),
    embeddings: toInt(embCount?.count),
    apiLogs: toInt(logCount?.count),
  };
}

/** Painel admin: estatísticas por base de conhecimento */
export async function getKnowledgeBasesAdminStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const bases = await db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      isActive: knowledgeBases.isActive,
      organizationId: knowledgeBases.organizationId,
      userId: knowledgeBases.userId,
      createdAt: knowledgeBases.createdAt,
    })
    .from(knowledgeBases)
    .orderBy(knowledgeBases.name);

  const results = await Promise.all(
    bases.map(async (kb) => {
      const [[docRow], [chunkRow], [embRow], [logRow]] = await Promise.all([
        db
          .select({ count: count() })
          .from(documents)
          .where(eq(documents.knowledgeBaseId, kb.id)),
        db
          .select({ count: count() })
          .from(documentChunks)
          .where(eq(documentChunks.knowledgeBaseId, kb.id)),
        db
          .select({ count: count() })
          .from(embeddings)
          .where(eq(embeddings.knowledgeBaseId, kb.id)),
        db
          .select({ count: count() })
          .from(apiLogs)
          .where(eq(apiLogs.knowledgeBaseId, kb.id)),
      ]);

      return {
        id: kb.id,
        name: kb.name,
        isActive: Boolean(kb.isActive),
        organizationId: kb.organizationId,
        userId: kb.userId,
        createdAt: kb.createdAt,
        documentsCount: toInt(docRow?.count),
        chunksCount: toInt(chunkRow?.count),
        embeddingsCount: toInt(embRow?.count),
        apiQueriesCount: toInt(logRow?.count),
      };
    })
  );

  return results;
}

export interface ApiLogsFilter {
  limit?: number;
  knowledgeBaseId?: number;
  apiKeyId?: number;
  searchText?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Painel admin: logs de API com base, chave e usuário */
export async function getRecentApiLogsDetailed(filters: ApiLogsFilter = {}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const conditions = [];
  if (filters.knowledgeBaseId) {
    conditions.push(eq(apiLogs.knowledgeBaseId, filters.knowledgeBaseId));
  }
  if (filters.apiKeyId) {
    conditions.push(eq(apiLogs.apiKeyId, filters.apiKeyId));
  }
  if (filters.searchText?.trim()) {
    const term = `%${filters.searchText.trim()}%`;
    conditions.push(or(like(apiLogs.query, term), like(apiLogs.answer, term)));
  }
  if (filters.dateFrom) {
    conditions.push(gte(apiLogs.createdAt, new Date(`${filters.dateFrom}T00:00:00`)));
  }
  if (filters.dateTo) {
    conditions.push(lte(apiLogs.createdAt, new Date(`${filters.dateTo}T23:59:59`)));
  }

  const limit = filters.limit ?? 20;

  const logs = await db
    .select({
      id: apiLogs.id,
      query: apiLogs.query,
      answer: apiLogs.answer,
      sourcesCount: apiLogs.sourcesCount,
      responseTime: apiLogs.responseTime,
      createdAt: apiLogs.createdAt,
      knowledgeBaseId: apiLogs.knowledgeBaseId,
      knowledgeBaseName: knowledgeBases.name,
      apiKeyId: apiLogs.apiKeyId,
      apiKeyName: apiKeys.name,
      userId: apiLogs.userId,
      userEmail: users.email,
      organizationId: apiLogs.organizationId,
    })
    .from(apiLogs)
    .leftJoin(knowledgeBases, eq(apiLogs.knowledgeBaseId, knowledgeBases.id))
    .leftJoin(apiKeys, eq(apiLogs.apiKeyId, apiKeys.id))
    .leftJoin(users, eq(apiLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(apiLogs.createdAt))
    .limit(limit);

  return logs.map((log) => ({
    ...log,
    knowledgeBaseName: log.knowledgeBaseName || `Base #${log.knowledgeBaseId}`,
    apiKeyName: log.apiKeyName || `Chave #${log.apiKeyId}`,
    userEmail: log.userEmail || `Usuário #${log.userId}`,
  }));
}

/** Lista API keys para filtros do painel */
export async function getApiKeysForAdminPanel() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      isActive: apiKeys.isActive,
      organizationId: apiKeys.organizationId,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .orderBy(apiKeys.name);
}
