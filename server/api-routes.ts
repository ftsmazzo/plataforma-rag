/**
 * Public API REST routes for external integrations (n8n, webhooks, etc.)
 * Authentication via API key in Authorization header
 */

import { Router, Request, Response } from "express";
import { getUserKnowledgeBases, getKnowledgeBaseById } from "./db-knowledge-bases";
import { getAllUserEmbeddings, getChunksByIds, getOrCreateSystemSettings } from "./db";
import { generateEmbedding, cosineSimilarity } from "./documentProcessor";
import { invokeLLM } from "./_core/llm";
import { validateApiKey as validateKey } from "./db-api-keys";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { apiLogs } from "../drizzle/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);

const router = Router();

/**
 * Middleware to validate API key
 * Expected header: Authorization: Bearer <api_key>
 */
async function validateApiKey(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "
  
  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Validate API key against database
  const keyData = await validateKey(apiKey);
  if (!keyData) {
    return res.status(401).json({ error: "Invalid or inactive API key" });
  }

  // Check rate limit
  const { checkRateLimit } = await import("./rate-limiter");
  const isLimited = checkRateLimit(keyData.apiKeyId, keyData.rateLimit);
  if (isLimited) {
    return res.status(429).json({ 
      error: "Rate limit exceeded",
      message: `Maximum ${keyData.rateLimit} requests per minute allowed`,
    });
  }

  // Attach user and organization to request
  (req as any).userId = keyData.userId;
  (req as any).organizationId = keyData.organizationId;
  (req as any).apiKeyId = keyData.apiKeyId;
  (req as any).rateLimit = keyData.rateLimit;
  (req as any).startTime = Date.now();
  
  next();
}

/**
 * GET /api/knowledge-bases
 * List all knowledge bases for the authenticated user
 */
router.get("/knowledge-bases", validateApiKey, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const organizationId = (req as any).organizationId;
    
    const bases = await getUserKnowledgeBases(userId, organizationId);
    
    res.json({
      success: true,
      data: bases.map(kb => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        isActive: kb.isActive === true || kb.isActive === 1,
        createdAt: kb.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[API] Error listing knowledge bases:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /api/kb/:id/query
 * Query a specific knowledge base
 * Body: { query: string, topK?: number }
 */
router.post("/kb/:id/query", validateApiKey, async (req: Request, res: Response) => {
  try {
    const kbId = parseInt(req.params.id);
    const { query, topK = 5 } = req.body;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'query' parameter" });
    }

    const userId = (req as any).userId;
    const organizationId = (req as any).organizationId;
    
    // Validate knowledge base exists and belongs to user
    const kb = await getKnowledgeBaseById(kbId, organizationId);
    if (!kb) {
      return res.status(404).json({ error: "Knowledge base not found" });
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query, userId, organizationId);
    
    // Search for similar chunks in this knowledge base only
    const { getEmbeddingsByKnowledgeBase, getChunksByIdsForKnowledgeBase } = await import("./db");
    const results = await getEmbeddingsByKnowledgeBase(kbId, organizationId);
    
    console.log(`[API] Found ${results.length} embeddings for knowledge base ${kbId}`);
    
    // Calculate cosine similarity
    const similarities = results.map(result => {
      // Embedding from vector type is already an array (fromDriver handles parsing)
      // But it might be stored as string in some cases, so handle both
      let embedding: number[];
      if (typeof result.embedding === 'string') {
        try {
          embedding = JSON.parse(result.embedding);
        } catch (e) {
          console.error("[API] Failed to parse embedding:", e);
          // Skip this result if embedding is invalid
          return null;
        }
      } else if (Array.isArray(result.embedding)) {
        embedding = result.embedding;
      } else {
        console.error("[API] Invalid embedding format:", typeof result.embedding);
        return null;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...result,
        similarity,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
    
    // Sort by similarity and take top K
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    console.log(`[API] Top ${topResults.length} results with similarities:`, topResults.map(r => r.similarity));
    
    // Get chunk content
    const chunkIds = topResults.map(r => r.chunkId);
    const chunks = await getChunksByIdsForKnowledgeBase(chunkIds, organizationId);
    
    console.log(`[API] Retrieved ${chunks.length} chunks`);
    
    // Generate answer using LLM (check provider settings)
    const settings = await getOrCreateSystemSettings(userId, organizationId);
    const context = chunks.map(c => c.content).join("\n\n");
    const systemPrompt = `You are a helpful assistant. Answer the user's question based on the following context. If the context doesn't contain relevant information, say so.

Context:
${context}`;
    
    let answer: string;
    
    if (settings && settings.llmProvider === 'ollama') {
      // Use Ollama
      console.log('[API] Using Ollama for query');
      const { generateOllamaChatCompletion } = await import("./ollama");
      try {
        answer = await generateOllamaChatCompletion(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          {
            baseUrl: settings.ollamaBaseUrl || 'http://localhost:11434',
            embeddingModel: settings.ollamaEmbeddingModel || 'nomic-embed-text',
            chatModel: settings.ollamaChatModel || 'llama3.2:1b',
          }
        );
      } catch (error) {
        console.error('[API] Ollama failed, falling back to OpenAI:', error);
        // Fallback to OpenAI
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
        });
        const answerContent = llmResponse.choices[0]?.message?.content;
        answer = typeof answerContent === 'string' ? answerContent : "No answer generated";
      }
    } else {
      // Use OpenAI
      console.log('[API] Using OpenAI for query');
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      });
      const answerContent = llmResponse.choices[0]?.message?.content;
      answer = typeof answerContent === 'string' ? answerContent : "No answer generated";
    }
    
    // Log API request
    const apiKeyId = (req as any).apiKeyId;
    const endTime = Date.now();
    const startTime = (req as any).startTime || endTime;
    const responseTime = endTime - startTime;
    
    await db.insert(apiLogs).values({
      apiKeyId,
      knowledgeBaseId: kbId,
      query,
      answer: String(answer),
      sourcesCount: topResults.length,
      responseTime,
      userId,
      organizationId,
    });
    
    res.json({
      success: true,
      data: {
        answer,
        sources: topResults.map((r, idx) => ({
          documentId: r.documentId,
          chunkId: r.chunkId,
          content: chunks[idx]?.content || "",
          similarity: r.similarity,
        })),
        knowledgeBase: {
          id: kb.id,
          name: kb.name,
        },
      },
    });
  } catch (error: any) {
    console.error("[API] Error querying knowledge base:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * Database table viewer routes (admin only, no auth for simplicity)
 */
router.get("/db/tables/:tableName", async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const allowedTables = ["knowledge_bases", "documents", "document_chunks", "embeddings", "api_keys", "api_logs"];
    
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const { Pool } = await import("pg");
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });
    const result = await tempPool.query(`SELECT * FROM ${tableName} LIMIT 100`);
    const rows = result.rows;
    await tempPool.end();
    
    res.json({ table: tableName, rows, count: (rows as any[]).length });
  } catch (error: any) {
    console.error("[API] Error fetching table:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
