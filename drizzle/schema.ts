import { pgTable, serial, text, timestamp, varchar, index, integer, boolean, pgEnum, customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define vector type for pgvector
function vector(name: string, options?: { dimensions?: number }) {
  const dimensions = options?.dimensions || 1536;
  return customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]): string {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: string): number[] {
      return JSON.parse(value);
    },
  })(name);
}

// Define enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const documentStatusEnum = pgEnum("status", ["uploading", "processing", "completed", "failed"]);
export const feedbackStatusEnum = pgEnum("status", ["open", "in_progress", "resolved", "closed"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const feedbackTypeEnum = pgEnum("type", ["bug", "feature", "improvement", "other"]);
export const notificationTypeEnum = pgEnum("type", ["info", "warning", "error", "success"]);

/**
 * Organizations table for multi-tenant support
 */
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  description: text("description"),
  logo: text("logo"), // URL to logo image
  settings: text("settings"), // JSON string for organization-specific settings
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Knowledge Bases - Multiple isolated knowledge bases per organization
 */
export const knowledgeBases = pgTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("userId").notNull(), // Creator of the knowledge base
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  webhookUrl: text("webhookUrl"), // Webhook URL for notifications (optional)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;

/**
 * Core user table with email/password authentication
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Hashed password
  name: text("name"),
  role: roleEnum("role").default("user").notNull(),
  organizationId: integer("organizationId").references(() => organizations.id), // NULL for super admins, set for org users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents uploaded by users
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  knowledgeBaseId: integer("knowledgeBaseId").notNull().references(() => knowledgeBases.id), // Link to knowledge base
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // pdf, xlsx, csv, png, jpg, txt
  fileSize: integer("fileSize").notNull(), // in bytes
  storageKey: varchar("storageKey", { length: 512 }).notNull(), // MinIO key (was s3Key)
  storageUrl: text("storageUrl").notNull(), // MinIO URL (was s3Url)
  status: documentStatusEnum("status").default("uploading").notNull(),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"), // JSON string for additional metadata
  tags: text("tags"), // Comma-separated tags
  description: text("description"), // User-provided description
  totalChunks: integer("totalChunks").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  knowledgeBaseIdIdx: index("knowledgeBaseId_idx").on(table.knowledgeBaseId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Chunks of text extracted from documents
 */
export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => documents.id),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  knowledgeBaseId: integer("knowledgeBaseId").notNull().references(() => knowledgeBases.id), // Link to knowledge base
  chunkIndex: integer("chunkIndex").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for chunk-specific metadata (page number, section, etc.)
  tokenCount: integer("tokenCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index("documentId_idx").on(table.documentId),
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  knowledgeBaseIdIdx: index("knowledgeBaseId_idx").on(table.knowledgeBaseId),
}));

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;

/**
 * Vector embeddings for semantic search using pgvector
 */
export const embeddings = pgTable("embeddings", {
  id: serial("id").primaryKey(),
  chunkId: integer("chunkId").notNull().unique().references(() => documentChunks.id),
  documentId: integer("documentId").notNull().references(() => documents.id),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  knowledgeBaseId: integer("knowledgeBaseId").notNull().references(() => knowledgeBases.id), // Link to knowledge base
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small has 1536 dimensions
  embeddingModel: varchar("embeddingModel", { length: 100 }).default("text-embedding-3-small").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  chunkIdIdx: index("chunkId_idx").on(table.chunkId),
  documentIdIdx: index("documentId_idx").on(table.documentId),
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  knowledgeBaseIdIdx: index("knowledgeBaseId_idx").on(table.knowledgeBaseId),
  // Note: Vector index (ivfflat) should be created manually after migrations:
  // CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
}));

export type Embedding = typeof embeddings.$inferSelect;
export type InsertEmbedding = typeof embeddings.$inferInsert;

/**
 * Document versions for version control
 */
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => documents.id),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  versionNumber: integer("versionNumber").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(), // MinIO key (was s3Key)
  storageUrl: text("storageUrl").notNull(), // MinIO URL (was s3Url)
  fileSize: integer("fileSize").notNull(),
  tags: text("tags"),
  description: text("description"),
  changeDescription: text("changeDescription"), // What changed in this version
  totalChunks: integer("totalChunks").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index("documentId_idx").on(table.documentId),
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
}));

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

/**
 * User feedback and suggestions
 */
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").references(() => organizations.id), // Optional - feedback can be org-specific or global
  type: feedbackTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: feedbackStatusEnum("status").default("open").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  adminResponse: text("adminResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Admin notifications for system events
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id), // Admin user who should see this
  organizationId: integer("organizationId").references(() => organizations.id), // Optional - notification can be org-specific or global
  type: notificationTypeEnum("type").default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // e.g., "document", "user", "feedback"
  relatedEntityId: integer("relatedEntityId"), // ID of the related entity
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  isReadIdx: index("isRead_idx").on(table.isRead),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * API Keys for external integrations (n8n, webhooks, etc.)
 */
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Human-readable name (e.g., "n8n Integration")
  key: varchar("key", { length: 64 }).notNull().unique(), // The actual API key (hashed or plain)
  userId: integer("userId").notNull().references(() => users.id), // Owner of the API key
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  rateLimit: integer("rateLimit").default(60).notNull(), // Requests per minute (default: 60)
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"), // Track last usage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  keyIdx: index("key_idx").on(table.key),
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * API Logs - Track all API requests for monitoring and debugging
 */
export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("apiKeyId").notNull().references(() => apiKeys.id), // Which API key was used
  knowledgeBaseId: integer("knowledgeBaseId").notNull().references(() => knowledgeBases.id), // Which knowledge base was queried
  query: text("query").notNull(), // The question asked
  answer: text("answer").notNull(), // The answer provided
  sourcesCount: integer("sourcesCount").default(0).notNull(), // Number of sources used
  responseTime: integer("responseTime").notNull(), // Response time in milliseconds
  userId: integer("userId").notNull().references(() => users.id), // Owner of the API key
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  apiKeyIdIdx: index("apiKeyId_idx").on(table.apiKeyId),
  knowledgeBaseIdIdx: index("knowledgeBaseId_idx").on(table.knowledgeBaseId),
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = typeof apiLogs.$inferInsert;

/**
 * System Settings - Configuration for LLM providers (OpenAI vs Ollama)
 */
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id), // Settings per user
  organizationId: integer("organizationId").notNull().references(() => organizations.id), // Multi-tenant isolation
  
  // LLM Provider Configuration
  llmProvider: varchar("llmProvider", { length: 50 }).default("openai").notNull(), // "openai" or "ollama"
  ollamaBaseUrl: text("ollamaBaseUrl"), // Ollama server URL (e.g., https://llm.fabricadosdados.online)
  ollamaEmbeddingModel: varchar("ollamaEmbeddingModel", { length: 100 }), // e.g., "nomic-embed-text"
  ollamaChatModel: varchar("ollamaChatModel", { length: 100 }), // e.g., "llama3.2:1b"
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  lastTestedAt: timestamp("lastTestedAt"), // Last time connection was tested
  lastTestStatus: varchar("lastTestStatus", { length: 50 }), // "success" or "failed"
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  organizationIdIdx: index("organizationId_idx").on(table.organizationId),
  llmProviderIdx: index("llmProvider_idx").on(table.llmProvider),
}));

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;
