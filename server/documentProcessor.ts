import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";

/**
 * Document processing utilities for RAG system
 * Handles PDF, images (OCR), Excel/CSV, and TXT files
 */

export interface ProcessedChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    pageNumber?: number;
    section?: string;
    rowRange?: string;
  };
  tokenCount: number;
}

/**
 * Sanitize text to remove invalid UTF-8 characters and null bytes
 * This is critical for PostgreSQL which requires valid UTF-8
 */
function sanitizeText(text: string): string {
  // Remove null bytes and other control characters (except newlines, tabs, carriage returns)
  return text
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove other control chars except \n, \t, \r
    .replace(/[\uFFFE\uFFFF]/g, '') // Remove invalid Unicode characters
    .normalize('NFKC') // Normalize Unicode (decompose and recompose)
    .trim();
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into semantic chunks
 * Uses simple paragraph-based chunking with overlap
 * For CSV data, uses line-based chunking to avoid huge chunks
 */
export function chunkText(text: string, maxTokens: number = 500, overlap: number = 50): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];
  
  // Detect if this is CSV/Spreadsheet data
  const looksLikeCSV = text.includes(',') && text.split('\n').length > 5;
  const hasSheetHeader = text.includes('=== Planilha:');
  
  // For CSV or Sheets, split by single newlines (rows) instead of paragraphs
  // This prevents huge chunks with hundreds of rows
  const paragraphs = (looksLikeCSV || hasSheetHeader)
    ? text.split(/\n/).filter(p => p.trim().length > 0)
    : text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    const currentTokens = estimateTokens(currentChunk);
    
    // If adding this paragraph exceeds max tokens, save current chunk
    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { chunkIndex },
        tokenCount: estimateTokens(currentChunk),
      });
      
      // Start new chunk with overlap (last few words)
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.min(overlap, words.length));
      currentChunk = overlapWords.join(" ") + "\n\n" + paragraph;
      chunkIndex++;
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { chunkIndex },
      tokenCount: estimateTokens(currentChunk),
    });
  }
  
  return chunks;
}

/**
 * Process PDF file
 */
export async function processPDF(buffer: Buffer): Promise<string> {
  try {
    const PDFParser = (await import("pdf2json")).default;
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          // Helper function to safely decode URI components
          const safeDecodeURI = (encoded: string): string => {
            try {
              return decodeURIComponent(encoded);
            } catch (e) {
              // If decoding fails, return the original string
              console.warn("[PDF] Failed to decode URI component:", encoded, e);
              return encoded;
            }
          };

          const text = pdfData.Pages.map((page: any) => 
            page.Texts.map((t: any) => 
              safeDecodeURI(t.R.map((r: any) => r.T).join(""))
            ).join(" ")
          ).join("\n\n");
          
          // Sanitize text to remove invalid UTF-8 characters and null bytes
          const sanitized = sanitizeText(text);
          resolve(sanitized || "[PDF sem texto extraível]");
        } catch (err) {
          reject(err);
        }
      });
      
      pdfParser.on("pdfParser_dataError", (error: any) => {
        reject(error);
      });
      
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error("[DocumentProcessor] PDF processing error:", error);
    throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Process image file with OCR
 */
export async function processImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const Tesseract = await import("tesseract.js");
    const worker = await Tesseract.createWorker(["por", "eng"]);
    
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    
    return text || "[Imagem sem texto reconhecível]";
  } catch (error) {
    console.error("[DocumentProcessor] OCR error:", error);
    throw new Error(`Erro ao processar imagem com OCR: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Process Excel/CSV file
 */
export async function processSpreadsheet(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === "csv") {
      return buffer.toString("utf-8");
    }
    
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `=== Planilha: ${name} ===\n${csv}`;
    });
    
    return sheets.join("\n\n") || "[Planilha vazia]";
  } catch (error) {
    console.error("[DocumentProcessor] Spreadsheet processing error:", error);
    throw new Error(`Erro ao processar planilha: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Process plain text file
 */
export async function processText(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

/**
 * Main document processor - routes to appropriate handler
 */
export async function processDocument(
  buffer: Buffer,
  fileType: string,
  mimeType: string
): Promise<ProcessedChunk[]> {
  let extractedText = "";
  
  try {
    switch (fileType.toLowerCase()) {
      case "pdf":
        extractedText = await processPDF(buffer);
        break;
      
      case "png":
      case "jpg":
      case "jpeg":
        extractedText = await processImage(buffer, mimeType);
        break;
      
      case "xlsx":
      case "xls":
      case "csv":
        extractedText = await processSpreadsheet(buffer, fileType);
        break;
      
      case "txt":
        extractedText = await processText(buffer);
        break;
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Sanitize extracted text to ensure valid UTF-8 (remove null bytes, control chars)
    const sanitizedText = sanitizeText(extractedText);
    
    // Chunk the extracted text
    return chunkText(sanitizedText);
    
  } catch (error) {
    console.error("[DocumentProcessor] Error processing document:", error);
    throw error;
  }
}

/**
 * Generate embeddings using configured provider (OpenAI or Ollama)
 * Automatically detects provider from system settings
 */
export async function generateEmbedding(text: string, userId?: number, organizationId?: number): Promise<number[]> {
  // Truncate text to fit within embedding model limits
  // OpenAI text-embedding-3-small has 8191 token limit
  // Estimate: 1 token ≈ 4 characters, so ~32,000 characters max
  // Use conservative limit of 30,000 characters (~7,500 tokens) to be safe
  const MAX_EMBEDDING_CHARS = 30000;
  const truncatedText = text.length > MAX_EMBEDDING_CHARS 
    ? text.slice(0, MAX_EMBEDDING_CHARS) + "...[truncated]"
    : text;
  
  if (text.length > MAX_EMBEDDING_CHARS) {
    console.log(`[Embeddings] Truncated text from ${text.length} to ${truncatedText.length} characters`);
  }
  
  // Try to get user settings if provided
  let settings = null;
  if (userId && organizationId) {
    try {
      const { getSystemSettings } = await import("./db");
      settings = await getSystemSettings(userId, organizationId);
    } catch (error) {
      console.warn("[Embeddings] Could not load settings, using OpenAI:", error);
    }
  }

  // Use Ollama if configured and available
  if (settings?.llmProvider === "ollama" && settings.ollamaBaseUrl) {
    try {
      const { generateOllamaEmbedding, DEFAULT_OLLAMA_CONFIG } = await import("./ollama");
      const config = {
        ...DEFAULT_OLLAMA_CONFIG,
        baseUrl: settings.ollamaBaseUrl,
        embeddingModel: settings.ollamaEmbeddingModel || DEFAULT_OLLAMA_CONFIG.embeddingModel,
      };
      
      console.log("[Embeddings] Using Ollama:", config.baseUrl, "model:", config.embeddingModel);
      const embedding = await generateOllamaEmbedding(truncatedText, config);
      console.log("[Embeddings] Ollama success - embedding dimension:", embedding.length);
      return embedding;
    } catch (error) {
      console.error("[Embeddings] Ollama failed:", error);
      throw new Error(`Ollama embedding failed: ${error instanceof Error ? error.message : String(error)}. Please check your Ollama server or switch to OpenAI in settings.`);
    }
  }

  // Default: Use OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  
  try {
    console.log("[Embeddings] Using OpenAI (model: text-embedding-3-small)");
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: truncatedText,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    console.log("[Embeddings] OpenAI success - embedding dimension:", embedding.length);
    return embedding;
    
  } catch (error) {
    console.error("[Embeddings] Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate relevant tags for document content using LLM
 */
export async function generateTags(documentContent: string, maxTags: number = 5): Promise<string[]> {
  try {
    // Limit content to ~2000 tokens (8000 characters) to stay within model limits
    // Model limit is 8192 tokens, leaving room for system prompt and response
    const truncatedContent = documentContent.slice(0, 8000);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a document analysis assistant. Generate relevant, concise tags for documents. Return ONLY a JSON array of strings, nothing else."
        },
        {
          role: "user",
          content: `Analyze this document content and generate ${maxTags} relevant tags. Tags should be:
- Single words or short phrases (2-3 words max)
- Descriptive of the main topics
- In Portuguese when appropriate
- Lowercase

Document content:
${truncatedContent}

Return ONLY a JSON array of tag strings, for example: ["imóveis", "vendas", "são paulo"]`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tags",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Array of relevant tags"
              }
            },
            required: ["tags"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return result.tags.slice(0, maxTags);
  } catch (error) {
    console.error("Error generating tags:", error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
