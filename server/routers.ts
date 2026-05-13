import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSessionToken, hashPassword, verifyPassword, clearSessionCookie, setSessionCookie } from "./_core/auth";
import { createUser, getUserByEmail } from "./db";
import { 
  createDocument, 
  getUserDocuments, 
  getDocumentById, 
  deleteDocument, 
  updateDocumentMetadata,
  createChunk,
  createEmbedding,
  getAllUserEmbeddings,
  getChunksByIds,
  updateDocumentStatus,
  getDocumentChunks,
  getAllDocuments,
  getAdminStats,
  deleteDocumentAsAdmin,
  getAllUsers,
  createDocumentVersion,
  getDocumentVersions,
  getDocumentVersion,
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  getUploadsByPeriod,
  getUserActivity,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  getSystemSettings,
  createSystemSettings,
  updateSystemSettings,
  getOrCreateSystemSettings
} from "./db";
import {
  createOrganization,
  getOrganizationById,
  getOrganizationBySlug,
  getAllOrganizations,
  getActiveOrganizations,
  updateOrganization,
  deactivateOrganization,
  activateOrganization,
  getOrganizationStats,
  assignUserToOrganization,
  getOrganizationUsers,
  getUsersWithoutOrganization,
} from "./db-organizations";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { processDocument, generateEmbedding, cosineSimilarity, generateTags } from "./documentProcessor";
import { notifyOwner } from "./_core/notification";
import { generateCSV, formatDocumentsForExport, formatFeedbackForExport, formatAnalyticsForExport } from "./export";

// Admin router - requires admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  return next({ ctx });
});

const adminRouter = router({
  stats: adminProcedure.query(async () => {
    return await getAdminStats();
  }),

  listDocuments: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      userId: z.number().optional(),
      status: z.string().optional(),
      fileType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await getAllDocuments(input);
    }),

  listUsers: adminProcedure.query(async () => {
    return await getAllUsers();
  }),

  deleteDocument: adminProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await deleteDocumentAsAdmin(input.documentId);
      return { success: true };
    }),

  // User Management
  listUsersInOrg: adminProcedure
    .query(async ({ ctx }) => {
      const organizationId = ctx.user.organizationId || 1;
      const { getAllUsersInOrganization } = await import("./db");
      return await getAllUsersInOrganization(organizationId);
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId || 1;
      const { deleteUserAndData } = await import("./db");
      return await deleteUserAndData(input.userId, organizationId);
    }),

  getUserKnowledgeBases: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId || 1;
      const { getUserKnowledgeBases } = await import("./db");
      return await getUserKnowledgeBases(input.userId, organizationId);
    }),

  deleteKnowledgeBase: adminProcedure
    .input(z.object({ kbId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.user.organizationId || 1;
      const { adminDeleteKnowledgeBase } = await import("./db");
      return await adminDeleteKnowledgeBase(input.kbId, organizationId);
    }),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Hash password
          const hashedPassword = await hashPassword(input.password);
          
          // Create user
          const user = await createUser({
            email: input.email,
            password: hashedPassword,
            name: input.name,
            role: "user",
          });

          // Create session token
          const token = await createSessionToken({
            userId: user.id,
            email: user.email,
            role: user.role,
          });

          // Set cookie
          setSessionCookie(ctx.res, token, ctx.req);

          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes("already exists")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "User with this email already exists",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user by email
        const user = await getUserByEmail(input.email);
        
        if (!user) {
          console.log("[Login] User not found:", input.email);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Debug: Log password hash info
        console.log("[Login] User found:", {
          id: user.id,
          email: user.email,
          passwordHashLength: user.password?.length || 0,
          passwordHashStart: user.password?.substring(0, 20) || "null",
          passwordHashType: typeof user.password,
        });

        // Verify password
        console.log("[Login] Verifying password...");
        const isValid = await verifyPassword(input.password, user.password);
        console.log("[Login] Password verification result:", isValid);
        
        if (!isValid) {
          console.log("[Login] Password verification failed for user:", user.email);
          console.log("[Login] Hash from DB:", user.password);
          console.log("[Login] Hash length:", user.password?.length);
          console.log("[Login] Hash type:", typeof user.password);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Create session token
        const token = await createSessionToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Set cookie
        setSessionCookie(ctx.res, token, ctx.req);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookie(ctx.res, ctx.req);
      return {
        success: true,
      } as const;
    }),
  }),

  documents: router({
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        base64Data: z.string(),
        mimeType: z.string(),
        knowledgeBaseId: z.number(), // Required: user must select a knowledge base
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const organizationId = ctx.user.organizationId || 1; // Default to org 1 if not set
        const buffer = Buffer.from(input.base64Data, 'base64');
        const fileExtension = input.filename.split('.').pop() || '';
        const s3Key = `${userId}/documents/${nanoid()}.${fileExtension}`;
        const { url: s3Url } = await storagePut(s3Key, buffer, input.mimeType);
        
        const document = await createDocument({
          userId,
          organizationId,
          knowledgeBaseId: input.knowledgeBaseId,
          filename: `${nanoid()}.${fileExtension}`,
          originalFilename: input.filename,
          fileType: input.fileType,
          fileSize: input.fileSize,
          storageKey: s3Key,
          storageUrl: s3Url,
          status: "processing",
        });
        
        processDocumentAsync(document.id, userId, organizationId, input.knowledgeBaseId, buffer, input.fileType, input.mimeType, input.filename, input.fileSize).catch(err => {
          console.error("[Documents] Error processing document:", err);
        });
        
        return document;
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      const organizationId = ctx.user.organizationId || undefined;
      return await getUserDocuments(ctx.user.id, organizationId);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const organizationId = ctx.user.organizationId || undefined;
        const document = await getDocumentById(input.id, ctx.user.id, organizationId);
        if (!document) throw new Error("Document not found");
        const chunks = await getDocumentChunks(input.id, ctx.user.id);
        return { ...document, chunks };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = ctx.user.organizationId || undefined;
        await deleteDocument(input.id, ctx.user.id, organizationId);
        return { success: true };
      }),
    
    updateMetadata: protectedProcedure
      .input(z.object({ 
        id: z.number(), 
        tags: z.string().optional(),
        description: z.string().optional(),
        metadata: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const organizationId = ctx.user.organizationId || undefined;
        await updateDocumentMetadata(id, ctx.user.id, updates, organizationId);
        return { success: true };
      }),
    
    generateTags: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = ctx.user.organizationId || undefined;
        const document = await getDocumentById(input.documentId, ctx.user.id, organizationId);
        if (!document) {
          throw new Error("Document not found");
        }

        // Get all chunks for this document (limit to first 5 to avoid token limits)
        const chunks = await getDocumentChunks(input.documentId, ctx.user.id);
        const limitedChunks = chunks.slice(0, 5); // Use only first 5 chunks
        const fullContent = limitedChunks.map((c: any) => c.content).join("\n\n");

        // Generate tags using AI
        const tags = await generateTags(fullContent, 8);
        
        return { tags };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), topK: z.number().default(5) }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const organizationId = ctx.user.organizationId || undefined;
        const queryEmbedding = await generateEmbedding(input.query, userId, organizationId);
        const userEmbeddings = await getAllUserEmbeddings(userId, organizationId);
        
        const similarities = userEmbeddings.map(emb => {
          const embVector = JSON.parse(emb.embedding);
          const similarity = cosineSimilarity(queryEmbedding, embVector);
          return { chunkId: emb.chunkId, documentId: emb.documentId, similarity };
        });
        
        const topResults = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, input.topK);
        const chunkIds = topResults.map(r => r.chunkId);
        const chunks = await getChunksByIds(chunkIds, userId, organizationId);
        
        const results = topResults.map(result => {
          const chunk = chunks.find(c => c.id === result.chunkId);
          return { ...result, content: chunk?.content || "", metadata: chunk?.metadata || "{}" };
        });
        
        return results;
      }),

    chat: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Get relevant chunks using semantic search
        const organizationId = ctx.user.organizationId || undefined;
        const queryEmbedding = await generateEmbedding(input.query, userId, organizationId);
        const userEmbeddings = await getAllUserEmbeddings(userId, organizationId);
        
        const similarities = userEmbeddings.map(emb => {
          const embVector = JSON.parse(emb.embedding);
          const similarity = cosineSimilarity(queryEmbedding, embVector);
          return { chunkId: emb.chunkId, documentId: emb.documentId, similarity };
        });
        
        const topResults = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
        const chunkIds = topResults.map(r => r.chunkId);
        const chunks = await getChunksByIds(chunkIds, userId, organizationId);
        
        // Build context from relevant chunks
        const context = chunks.map((chunk, idx) => {
          const similarity = topResults[idx]?.similarity || 0;
          return `[Documento: ${chunk.documentName}]\n${chunk.content}`;
        }).join("\n\n---\n\n");
        
        // Generate answer using LLM (check provider settings)
        const settings = await getOrCreateSystemSettings(userId, organizationId || 1);
        let answer: string;
        
        const systemMessage = `Você é um assistente especializado em responder perguntas baseado em documentos fornecidos. Use apenas as informações do contexto abaixo para responder. Se a informação não estiver no contexto, diga que não encontrou a informação nos documentos disponíveis.\n\nContexto:\n${context}`;
        
        if (settings && settings.llmProvider === 'ollama') {
          // Use Ollama
          console.log('[Chat] Using Ollama');
          const { generateOllamaChatCompletion } = await import("./ollama");
          try {
            answer = await generateOllamaChatCompletion(
              [
                { role: "system", content: systemMessage },
                { role: "user", content: input.query },
              ],
              {
                baseUrl: settings.ollamaBaseUrl || 'http://localhost:11434',
                embeddingModel: settings.ollamaEmbeddingModel || 'nomic-embed-text',
                chatModel: settings.ollamaChatModel || 'llama3.2:1b',
              }
            );
          } catch (error) {
            console.error('[Chat] Ollama failed, falling back to OpenAI:', error);
            // Fallback to OpenAI
            const { invokeLLM } = await import("./_core/llm");
            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: input.query },
              ],
            });
            const answerContent = response.choices[0]?.message?.content;
            answer = typeof answerContent === 'string' ? answerContent : "Desculpe, não consegui gerar uma resposta.";
          }
        } else {
          // Use OpenAI
          console.log('[Chat] Using OpenAI');
          const { invokeLLM } = await import("./_core/llm");
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: input.query },
            ],
          });
          const answerContent = response.choices[0]?.message?.content;
          answer = typeof answerContent === 'string' ? answerContent : "Desculpe, não consegui gerar uma resposta.";
        }
        
        // Return answer with sources
        const sources = chunks.map((chunk, idx) => ({
          documentName: chunk.documentName || "Documento sem nome",
          chunkText: chunk.content.substring(0, 200) + "...",
          similarity: topResults[idx]?.similarity || 0,
        }));
        
        return { answer, sources };
      }),
  }),

  admin: adminRouter,

  // Versioning router
  versions: router({
    create: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        changeDescription: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        return await createDocumentVersion({
          documentId: input.documentId,
          userId: ctx.user.id,
          organizationId: doc.organizationId,
          filename: doc.filename,
          s3Key: doc.s3Key,
          s3Url: doc.s3Url,
          fileSize: doc.fileSize,
          tags: doc.tags || undefined,
          description: doc.description || undefined,
          changeDescription: input.changeDescription,
          totalChunks: doc.totalChunks || 0,
        });
      }),

    list: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getDocumentVersions(input.documentId, ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getDocumentVersion(input.versionId, ctx.user.id);
      }),
  }),

  // Feedback router
  feedback: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["bug", "feature", "improvement", "other"]),
        title: z.string().min(5).max(255),
        description: z.string().min(10),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const feedback = await createFeedback({
          userId: ctx.user.id,
          ...input,
        });

        // Notify owner about new feedback (non-blocking)
        try {
          await notifyOwner({
            title: `Novo Feedback: ${input.title}`,
            content: `Tipo: ${input.type}\nPrioridade: ${input.priority || "medium"}\n\n${input.description}`,
          });
        } catch (notifyError) {
          // Non-blocking: log but don't fail feedback creation
          console.warn("[Feedback] Failed to notify owner (non-blocking):", notifyError);
        }

        return feedback;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserFeedback(ctx.user.id);
    }),

    listAll: adminProcedure.query(async () => {
      return await getAllFeedback();
    }),

    updateStatus: adminProcedure
      .input(z.object({
        feedbackId: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        adminResponse: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateFeedbackStatus(input.feedbackId, input.status, input.adminResponse);
        return { success: true };
      }),
  }),

  // Analytics router
  analytics: router({
    uploadsByPeriod: adminProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        return await getUploadsByPeriod(input.days);
      }),

    userActivity: adminProcedure.query(async () => {
      return await getUserActivity();
    }),
  }),

  // Export router
  export: router({
    documents: adminProcedure
      .input(z.object({
        userId: z.number().optional(),
        status: z.string().optional(),
        fileType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const documents = await getAllDocuments({
          limit: 10000,
          offset: 0,
          ...input,
        });
        
        const formatted = formatDocumentsForExport(documents);
        const headers = ['id', 'filename', 'fileType', 'fileSize', 'status', 'totalChunks', 'tags', 'description', 'userName', 'userEmail', 'createdAt', 'updatedAt'];
        const csv = generateCSV(formatted, headers);
        
        return {
          csv,
          filename: `documents_${new Date().toISOString().split('T')[0]}.csv`,
        };
      }),

    feedback: adminProcedure.query(async () => {
      const feedback = await getAllFeedback();
      const formatted = formatFeedbackForExport(feedback);
      const headers = ['id', 'type', 'title', 'description', 'priority', 'status', 'userName', 'userEmail', 'adminResponse', 'createdAt'];
      const csv = generateCSV(formatted, headers);
      
      return {
        csv,
        filename: `feedback_${new Date().toISOString().split('T')[0]}.csv`,
      };
    }),

    analytics: adminProcedure
      .input(z.object({ days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const data = await getUploadsByPeriod(input.days);
        const formatted = formatAnalyticsForExport(data);
        const headers = ['date', 'count', 'value'];
        const csv = generateCSV(formatted, headers);
        
        return {
          csv,
          filename: `analytics_${new Date().toISOString().split('T')[0]}.csv`,
        };
      }),
  }),

  // Notifications router
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional().default(false) }))
      .query(async ({ input, ctx }) => {
        return await getUserNotifications(ctx.user.id, input.unreadOnly);
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadNotificationCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await markNotificationAsRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // Organizations router - admin only
  organizations: router({
    list: adminProcedure.query(async () => {
      return await getAllOrganizations();
    }),

    listActive: protectedProcedure.query(async () => {
      return await getActiveOrganizations();
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrganizationById(input.id);
      }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getOrganizationBySlug(input.slug);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        logo: z.string().optional(),
        settings: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createOrganization(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        settings: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await updateOrganization(id, updates);
        return { success: true };
      }),

    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deactivateOrganization(input.id);
        return { success: true };
      }),

    activate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await activateOrganization(input.id);
        return { success: true };
      }),

    stats: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrganizationStats(input.id);
      }),

    users: adminProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return await getOrganizationUsers(input.organizationId);
      }),

    usersWithoutOrg: adminProcedure.query(async () => {
      return await getUsersWithoutOrganization();
    }),

    assignUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        organizationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await assignUserToOrganization(input.userId, input.organizationId);
        return { success: true };
      }),
  }),

  knowledgeBases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserKnowledgeBases } = await import("./db-knowledge-bases");
      return await getUserKnowledgeBases(ctx.user.id, ctx.user.organizationId || undefined);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        webhookUrl: z.string().url().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createKnowledgeBase } = await import("./db-knowledge-bases");
        const organizationId = ctx.user.organizationId || 1;
        return await createKnowledgeBase({
          name: input.name,
          description: input.description,
          webhookUrl: input.webhookUrl,
          userId: ctx.user.id,
          organizationId,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getKnowledgeBaseById } = await import("./db-knowledge-bases");
        return await getKnowledgeBaseById(input.id, ctx.user.organizationId || undefined);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        webhookUrl: z.string().url().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateKnowledgeBase } = await import("./db-knowledge-bases");
        const { id, ...updates } = input;
        await updateKnowledgeBase(id, ctx.user.id, updates, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deactivateKnowledgeBase } = await import("./db-knowledge-bases");
        await deactivateKnowledgeBase(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    activate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { activateKnowledgeBase } = await import("./db-knowledge-bases");
        await activateKnowledgeBase(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getKnowledgeBaseStats } = await import("./db-knowledge-bases");
        return await getKnowledgeBaseStats(input.id, ctx.user.organizationId || undefined);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteKnowledgeBase } = await import("./db-knowledge-bases");
        await deleteKnowledgeBase(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    backup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { documents, documentChunks, embeddings, knowledgeBases } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Verify ownership
        const kb = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, input.id)).limit(1);
        if (!kb.length || (ctx.user.organizationId && kb[0].organizationId !== ctx.user.organizationId)) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Get all related data
        const docs = await db.select().from(documents).where(eq(documents.knowledgeBaseId, input.id));
        const chunks = await db.select().from(documentChunks).where(eq(documentChunks.knowledgeBaseId, input.id));
        const embeds = await db.select().from(embeddings).where(eq(embeddings.knowledgeBaseId, input.id));
        
        return {
          knowledgeBase: kb[0],
          documents: docs,
          documentChunks: chunks,
          embeddings: embeds,
          exportedAt: new Date().toISOString(),
        };
      }),

    restore: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        data: z.object({
          documents: z.array(z.any()),
          documentChunks: z.array(z.any()),
          embeddings: z.array(z.any()),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { documents, documentChunks, embeddings, knowledgeBases } = await import("../drizzle/schema");
        
        // Create new knowledge base
        const organizationId = ctx.user.organizationId || 1;
        const [newKb] = await db.insert(knowledgeBases).values({
          name: input.name,
          description: input.description,
          userId: ctx.user.id,
          organizationId,
          isActive: 1,
        });
        
        const newKbId = Number(newKb.insertId);
        
        // Restore documents
        if (input.data.documents.length > 0) {
          const docsToInsert = input.data.documents.map((doc: any) => ({
            filename: doc.filename,
            originalFilename: doc.originalFilename || doc.filename,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            s3Key: doc.s3Key,
            s3Url: doc.s3Url,
            status: doc.status,
            userId: ctx.user.id,
            organizationId,
            knowledgeBaseId: newKbId,
            tags: doc.tags,
            description: doc.description,
          }));
          await db.insert(documents).values(docsToInsert);
        }
        
        // Restore chunks
        if (input.data.documentChunks.length > 0) {
          const chunksToInsert = input.data.documentChunks.map((chunk: any) => ({
            documentId: chunk.documentId,
            userId: ctx.user.id,
            organizationId,
            knowledgeBaseId: newKbId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            metadata: chunk.metadata,
            tokenCount: chunk.tokenCount,
          }));
          await db.insert(documentChunks).values(chunksToInsert);
        }
        
        // Restore embeddings
        if (input.data.embeddings.length > 0) {
          const embedsToInsert = input.data.embeddings.map((embed: any) => ({
            chunkId: embed.chunkId,
            documentId: embed.documentId,
            userId: ctx.user.id,
            organizationId,
            knowledgeBaseId: newKbId,
            embedding: embed.embedding,
            embeddingModel: embed.embeddingModel || "text-embedding-3-small",
          }));
          await db.insert(embeddings).values(embedsToInsert);
        }
        
        return { success: true, knowledgeBaseId: newKbId };
      }),
  }),

  // API Keys management
  apiKeys: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserApiKeys } = await import("./db-api-keys");
        return await getUserApiKeys(ctx.user.id, ctx.user.organizationId || undefined);
      }),

    create: protectedProcedure
      .input(z.object({ 
        name: z.string(),
        rateLimit: z.number().min(1).max(1000).default(60),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createApiKey } = await import("./db-api-keys");
        if (!ctx.user.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Organization required" });
        }
        return await createApiKey({
          name: input.name,
          userId: ctx.user.id,
          organizationId: ctx.user.organizationId,
          rateLimit: input.rateLimit,
        });
      }),

    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deactivateApiKey } = await import("./db-api-keys");
        await deactivateApiKey(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    activate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { activateApiKey } = await import("./db-api-keys");
        await activateApiKey(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteApiKey } = await import("./db-api-keys");
        await deleteApiKey(input.id, ctx.user.id, ctx.user.organizationId || undefined);
        return { success: true };
      }),
  }),

  database: router({
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { organizations, users, knowledgeBases, apiKeys, documents, documentChunks, embeddings, apiLogs } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");
        
        const statsResult: any = await db.execute(sql`
          SELECT 
            (SELECT COUNT(*) FROM ${organizations}) as organizations,
            (SELECT COUNT(*) FROM ${users}) as users,
            (SELECT COUNT(*) FROM ${knowledgeBases}) as knowledge_bases,
            (SELECT COUNT(*) FROM ${apiKeys}) as api_keys,
            (SELECT COUNT(*) FROM ${documents}) as documents,
            (SELECT COUNT(*) FROM ${documentChunks}) as chunks,
            (SELECT COUNT(*) FROM ${embeddings}) as embeddings,
            (SELECT COUNT(*) FROM ${apiLogs}) as api_logs
        `);
        
        const stats = statsResult[0][0];
        
        return {
          organizations: stats.organizations,
          users: stats.users,
          knowledgeBases: stats.knowledge_bases,
          apiKeys: stats.api_keys,
          documents: stats.documents,
          chunks: stats.chunks,
          embeddings: stats.embeddings,
          apiLogs: stats.api_logs,
        };
      }),

    knowledgeBaseStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { knowledgeBases, documents, documentChunks, embeddings } = await import("../drizzle/schema");
        const { sql, eq } = await import("drizzle-orm");
        
        const bases = await db.select().from(knowledgeBases);
        
        const results = await Promise.all(bases.map(async (kb: any) => {
          const docCountResult: any = await db.execute(sql`SELECT COUNT(*) as count FROM ${documents} WHERE ${documents.knowledgeBaseId} = ${kb.id}`);
          const chunkCountResult: any = await db.execute(sql`SELECT COUNT(*) as count FROM ${documentChunks} WHERE ${documentChunks.knowledgeBaseId} = ${kb.id}`);
          const embCountResult: any = await db.execute(sql`SELECT COUNT(*) as count FROM ${embeddings} WHERE ${embeddings.knowledgeBaseId} = ${kb.id}`);
          
          return {
            id: kb.id,
            name: kb.name,
            isActive: kb.isActive === 1,
            documentsCount: docCountResult[0][0].count,
            chunksCount: chunkCountResult[0][0].count,
            embeddingsCount: embCountResult[0][0].count,
          };
        }));
        
        return results;
      }),

    recentApiLogs: protectedProcedure
      .input(z.object({ 
        limit: z.number().default(20),
        knowledgeBaseId: z.number().optional(),
        searchText: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { apiLogs, knowledgeBases } = await import("../drizzle/schema");
        const { desc, eq, and, gte, lte, or, like } = await import("drizzle-orm");
        
        // Build where conditions
        const conditions = [];
        if (input.knowledgeBaseId) {
          conditions.push(eq(apiLogs.knowledgeBaseId, input.knowledgeBaseId));
        }
        if (input.searchText) {
          conditions.push(
            or(
              like(apiLogs.query, `%${input.searchText}%`),
              like(apiLogs.answer, `%${input.searchText}%`)
            )
          );
        }
        if (input.dateFrom) {
          conditions.push(gte(apiLogs.createdAt, new Date(input.dateFrom)));
        }
        if (input.dateTo) {
          conditions.push(lte(apiLogs.createdAt, new Date(input.dateTo)));
        }
        
        let query = db
          .select({
            id: apiLogs.id,
            query: apiLogs.query,
            answer: apiLogs.answer,
            sourcesCount: apiLogs.sourcesCount,
            responseTime: apiLogs.responseTime,
            createdAt: apiLogs.createdAt,
            knowledgeBaseId: apiLogs.knowledgeBaseId,
            knowledgeBaseName: knowledgeBases.name,
          })
          .from(apiLogs)
          .leftJoin(knowledgeBases, eq(apiLogs.knowledgeBaseId, knowledgeBases.id))
          .orderBy(desc(apiLogs.createdAt))
          .limit(input.limit);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }
        
        const logs = await query;
        
        return logs;
      }),

    getTableData: protectedProcedure
      .input(z.object({
        tableName: z.enum([
          "users",
          "organizations", 
          "knowledge_bases",
          "api_keys",
          "api_logs",
          "documents",
          "document_chunks",
          "embeddings",
          "feedback"
        ]),
        limit: z.number().default(100),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const schema = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        
        // Map table names to schema objects
        const tableMap: Record<string, any> = {
          users: schema.users,
          organizations: schema.organizations,
          knowledge_bases: schema.knowledgeBases,
          api_keys: schema.apiKeys,
          api_logs: schema.apiLogs,
          documents: schema.documents,
          document_chunks: schema.documentChunks,
          embeddings: schema.embeddings,
          feedback: schema.feedback,
        };
        
        const table = tableMap[input.tableName];
        if (!table) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Tabela inválida" });
        }
        
        // Get data with limit
        const data = await db.select().from(table).limit(input.limit);
        
        // Get column names from first row
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        
        return {
          tableName: input.tableName,
          columns,
          rows: data,
          totalRows: data.length,
        };
      }),

    clearDatabase: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
        const db = drizzle(pool);
        const { documents, documentChunks, embeddings, apiLogs, apiKeys } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");
        
        // Delete all data (keep knowledge bases and users)
        await db.delete(embeddings);
        await db.delete(documentChunks);
        await db.delete(documents);
        await db.delete(apiLogs);
        // Optionally delete API keys
        // await db.delete(apiKeys);
        
        return { success: true, message: "Banco de dados limpo com sucesso" };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const organizationId = ctx.user.organizationId || 1;
      return await getOrCreateSystemSettings(userId, organizationId);
    }),

    update: protectedProcedure
      .input(z.object({
        llmProvider: z.enum(["openai", "ollama"]).optional(),
        ollamaBaseUrl: z.string().optional(),
        ollamaEmbeddingModel: z.string().optional(),
        ollamaChatModel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const organizationId = ctx.user.organizationId || 1;
        
        // Ensure settings exist first
        await getOrCreateSystemSettings(userId, organizationId);
        
        // Update settings
        await updateSystemSettings(userId, organizationId, input);
        
        return { success: true };
      }),

    testConnection: protectedProcedure
      .input(z.object({
        baseUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { testOllamaConnection } = await import("./ollama");
        const isConnected = await testOllamaConnection(input.baseUrl);
        
        if (isConnected) {
          // Update last tested timestamp
          const userId = ctx.user.id;
          const organizationId = ctx.user.organizationId || 1;
          await updateSystemSettings(userId, organizationId, {
            lastTestedAt: new Date(),
            lastTestStatus: "success",
          });
        }
        
        return { success: isConnected };
      }),

    getModels: protectedProcedure
      .input(z.object({
        baseUrl: z.string(),
      }))
      .query(async ({ input }) => {
        const { getOllamaModels } = await import("./ollama");
        try {
          const models = await getOllamaModels(input.baseUrl);
          return { success: true, models };
        } catch (error) {
          return { success: false, models: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

async function processDocumentAsync(
  documentId: number,
  userId: number,
  organizationId: number,
  knowledgeBaseId: number,
  buffer: Buffer,
  fileType: string,
  mimeType: string,
  filename: string,
  fileSize: number
): Promise<void> {
  const startTime = Date.now();
  try {
    console.log(`[ProcessDocument] Starting document ${documentId}, type: ${fileType}, size: ${fileSize}, filename: ${filename}`);
    const chunks = await processDocument(buffer, fileType, mimeType);
    console.log(`[ProcessDocument] Successfully extracted ${chunks.length} chunks from document ${documentId}`);
    
    for (const chunk of chunks) {
      const savedChunk = await createChunk({
        documentId,
        userId,
        organizationId,
        knowledgeBaseId,
        chunkIndex: chunk.metadata.chunkIndex,
        content: chunk.content,
        metadata: JSON.stringify(chunk.metadata),
        tokenCount: chunk.tokenCount,
      });
      
      const embedding = await generateEmbedding(chunk.content, userId, organizationId);
      
      // Ensure embedding is an array
      if (!Array.isArray(embedding)) {
        throw new Error(`Invalid embedding format: expected array, got ${typeof embedding}`);
      }
      
      await createEmbedding({
        chunkId: savedChunk.id,
        documentId,
        userId,
        organizationId,
        knowledgeBaseId,
        embedding: embedding, // Pass array directly, not JSON string
        embeddingModel: "text-embedding-3-small",
      });
    }
    
    await updateDocumentStatus(documentId, "completed", undefined, chunks.length);
    
    const processingTime = Date.now() - startTime;
    
    // Send webhook notification if configured
    const { getKnowledgeBaseById } = await import("./db-knowledge-bases");
    const kb = await getKnowledgeBaseById(knowledgeBaseId, organizationId);
    if (kb && kb.webhookUrl) {
      const { notifyDocumentProcessed } = await import("./webhook");
      await notifyDocumentProcessed(
        kb.webhookUrl,
        { id: kb.id, name: kb.name },
        { id: documentId, filename, fileSize, totalChunks: chunks.length },
        { processingTime, chunksCreated: chunks.length, embeddingsCreated: chunks.length }
      );
    }
    
    // Notify owner if document is large (non-blocking)
    if (chunks.length > 50) {
      try {
        await notifyOwner({
          title: "Documento grande processado",
          content: `Documento ID ${documentId} foi processado com sucesso. Total de chunks: ${chunks.length}`,
        });
      } catch (notifyError) {
        // Non-blocking: log but don't fail document processing
        console.warn("[ProcessDocument] Failed to notify owner (non-blocking):", notifyError);
      }
    }
  } catch (error) {
    console.error(`[ProcessDocument] Error processing document ${documentId}:`, error);
    console.error(`[ProcessDocument] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateDocumentStatus(documentId, "failed", errorMessage);
    
    // Send webhook notification if configured
    try {
      const { getKnowledgeBaseById } = await import("./db-knowledge-bases");
      const kb = await getKnowledgeBaseById(knowledgeBaseId, organizationId);
      if (kb && kb.webhookUrl) {
        const { notifyDocumentFailed } = await import("./webhook");
        await notifyDocumentFailed(
          kb.webhookUrl,
          { id: kb.id, name: kb.name },
          { id: documentId, filename, fileSize },
          errorMessage
        );
      }
    } catch (webhookError) {
      console.error("[ProcessDocument] Failed to send webhook:", webhookError);
    }
    
    // Notify owner about failure (non-blocking)
    try {
      await notifyOwner({
        title: "Falha no processamento de documento",
        content: `Documento ID ${documentId} falhou: ${errorMessage}`,
      });
    } catch (notifyError) {
      // Non-blocking: log but don't fail error handling
      console.warn("[ProcessDocument] Failed to notify owner (non-blocking):", notifyError);
    }
  }
}
