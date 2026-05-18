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
    sheetName?: string;
    rowNumber?: number;
    chunkType?: "prose" | "spreadsheet_row";
  };
  tokenCount: number;
}

const SHEET_MARKER_RE = /^=== Planilha:\s*(.+?)\s*===$/;
const MIN_CHUNK_CHARS = 12;
const MIN_ALNUM_CHARS = 3;

/**
 * Sanitize text to remove invalid UTF-8 characters and null bytes
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\uFEFF/g, "") // BOM
    .replace(/\x00/g, "")
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\uFFFE\uFFFF]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width spaces
    .replace(/\s+/g, " ")
    .normalize("NFKC")
    .trim();
}

/**
 * Sanitize prose text while preserving paragraph breaks
 */
function sanitizeProseText(text: string): string {
  return text
    .replace(/\uFEFF/g, "")
    .replace(/\x00/g, "")
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\uFFFE\uFFFF]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFKC");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Reject chunks that would pollute retrieval (spaces only, punctuation noise, etc.)
 */
export function isValidChunkContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length < MIN_CHUNK_CHARS) return false;

  if (/^[\s,;|.\-_:]+$/u.test(trimmed)) return false;

  const alnumMatches = trimmed.match(/[\p{L}\p{N}]/gu);
  const alnumCount = alnumMatches?.length ?? 0;
  if (alnumCount < MIN_ALNUM_CHARS) return false;

  const ratio = alnumCount / trimmed.length;
  if (ratio < 0.08 && trimmed.length < 80) return false;

  return true;
}

function finalizeChunks(chunks: ProcessedChunk[]): ProcessedChunk[] {
  return chunks
    .map((chunk, index) => ({
      ...chunk,
      content: sanitizeText(chunk.content),
      metadata: { ...chunk.metadata, chunkIndex: index },
      tokenCount: estimateTokens(chunk.content),
    }))
    .filter((chunk) => isValidChunkContent(chunk.content));
}

function detectDelimiter(line: string): "," | ";" | "\t" {
  const counts = {
    ",": (line.match(/,/g) || []).length,
    ";": (line.match(/;/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
  };
  if (counts["\t"] >= counts[","] && counts["\t"] >= counts[";"] && counts["\t"] > 0) {
    return "\t";
  }
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

/**
 * Parse a single CSV/TSV line respecting quoted fields
 */
export function parseDelimitedLine(line: string, delimiter: "," | ";" | "\t"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(sanitizeText(current));
      current = "";
      continue;
    }

    current += char;
  }

  result.push(sanitizeText(current));
  return result;
}

function isEmptyRow(values: string[]): boolean {
  return values.every((v) => !v || !v.trim());
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header, index) => {
    const cleaned = sanitizeText(header);
    return cleaned || `coluna_${index + 1}`;
  });
}

/**
 * Build one retrieval-friendly chunk per spreadsheet row (header + values)
 */
export function formatSpreadsheetRowChunk(
  sheetName: string,
  rowNumber: number,
  headers: string[],
  values: string[]
): string {
  const pairs: string[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i] ?? `coluna_${i + 1}`;
    const value = sanitizeText(values[i] ?? "");
    if (!value) continue;
    pairs.push(`${header}: ${value}`);
  }

  if (pairs.length === 0) return "";

  return `Planilha: ${sheetName} | Linha: ${rowNumber}\n${pairs.join(" | ")}`;
}

interface SpreadsheetSection {
  sheetName: string;
  lines: string[];
}

function splitSpreadsheetSections(text: string): SpreadsheetSection[] {
  const lines = text.split(/\r?\n/);
  const sections: SpreadsheetSection[] = [];
  let currentSheet = "Planilha";
  let currentLines: string[] = [];

  const flush = () => {
    if (currentLines.length > 0) {
      sections.push({ sheetName: currentSheet, lines: currentLines });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const sheetMatch = line.match(SHEET_MARKER_RE);
    if (sheetMatch) {
      flush();
      currentSheet = sanitizeText(sheetMatch[1]!) || "Planilha";
      continue;
    }
    currentLines.push(line);
  }

  flush();

  if (sections.length === 0) {
    return [{ sheetName: "Planilha", lines }];
  }

  return sections;
}

/**
 * One chunk per data row — optimal for tabular RAG queries
 */
export function chunkSpreadsheet(text: string): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];
  let chunkIndex = 0;
  const sections = splitSpreadsheetSections(text);

  for (const section of sections) {
    const nonEmptyLines = section.lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (nonEmptyLines.length === 0) continue;

    const delimiter = detectDelimiter(nonEmptyLines[0]!);
    const firstRowCells = parseDelimitedLine(nonEmptyLines[0]!, delimiter);

    const looksLikeHeader =
      firstRowCells.some((cell) => /[a-zA-Z\u00C0-\u024F]/u.test(cell)) &&
      !firstRowCells.every((cell) => /^\d+([.,]\d+)?$/.test(cell.trim()));

    let headers: string[];
    let dataStartIndex: number;

    if (looksLikeHeader) {
      headers = normalizeHeaders(firstRowCells);
      dataStartIndex = 1;
    } else {
      headers = firstRowCells.map((_, index) => `coluna_${index + 1}`);
      dataStartIndex = 0;
    }

    for (let lineIdx = dataStartIndex; lineIdx < nonEmptyLines.length; lineIdx++) {
      const line = nonEmptyLines[lineIdx]!;
      const values = parseDelimitedLine(line, delimiter);

      if (isEmptyRow(values)) continue;

      const rowNumber = looksLikeHeader ? lineIdx : lineIdx + 1;
      const content = formatSpreadsheetRowChunk(
        section.sheetName,
        rowNumber,
        headers,
        values
      );

      if (!isValidChunkContent(content)) continue;

      chunks.push({
        content,
        metadata: {
          chunkIndex: chunkIndex++,
          sheetName: section.sheetName,
          rowNumber,
          rowRange: String(rowNumber),
          chunkType: "spreadsheet_row",
        },
        tokenCount: estimateTokens(content),
      });
    }
  }

  return finalizeChunks(chunks);
}

/**
 * Prose chunking for PDF, TXT and OCR — paragraph-based with overlap
 */
export function chunkText(text: string, maxTokens: number = 500, overlap: number = 50): ProcessedChunk[] {
  const chunks: ProcessedChunk[] = [];
  const paragraphs = sanitizeProseText(text)
    .split(/\n\n+/)
    .map((p) => sanitizeText(p.replace(/\n+/g, " ")))
    .filter((p) => isValidChunkContent(p));

  if (paragraphs.length === 0) return [];

  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    const currentTokens = estimateTokens(currentChunk);

    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { chunkIndex, chunkType: "prose" },
        tokenCount: estimateTokens(currentChunk),
      });

      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.min(overlap, words.length));
      currentChunk = overlapWords.join(" ") + " " + paragraph;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? " " : "") + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: { chunkIndex, chunkType: "prose" },
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return finalizeChunks(chunks);
}

function isSpreadsheetType(fileType: string): boolean {
  const t = fileType.toLowerCase();
  return t === "csv" || t === "xlsx" || t === "xls";
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
          const safeDecodeURI = (encoded: string): string => {
            try {
              return decodeURIComponent(encoded);
            } catch {
              return encoded;
            }
          };

          const text = pdfData.Pages.map((page: any) =>
            page.Texts.map((t: any) =>
              safeDecodeURI(t.R.map((r: any) => r.T).join(""))
            ).join(" ")
          ).join("\n\n");

          resolve(sanitizeProseText(text) || "[PDF sem texto extraível]");
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

    return sanitizeProseText(text) || "[Imagem sem texto reconhecível]";
  } catch (error) {
    console.error("[DocumentProcessor] OCR error:", error);
    throw new Error(`Erro ao processar imagem com OCR: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Process Excel/CSV file — outputs sheet markers + CSV rows for row-based chunking
 */
export async function processSpreadsheet(buffer: Buffer, fileType: string): Promise<string> {
  try {
    const XLSX = await import("xlsx");

    const workbook =
      fileType === "csv"
        ? XLSX.read(buffer, { type: "buffer", raw: false })
        : XLSX.read(buffer, { type: "buffer" });

    if (workbook.SheetNames.length === 0) {
      return "[Planilha vazia]";
    }

    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      const sanitizedCsv = csv
        .split(/\r?\n/)
        .map((line) => sanitizeText(line.replace(/\s+/g, " ").trim()))
        .filter((line) => line.length > 0)
        .join("\n");

      return `=== Planilha: ${name} ===\n${sanitizedCsv}`;
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
  return sanitizeProseText(buffer.toString("utf-8"));
}

/**
 * Main document processor - routes to appropriate handler and chunking strategy
 */
export async function processDocument(
  buffer: Buffer,
  fileType: string,
  mimeType: string
): Promise<ProcessedChunk[]> {
  const normalizedType = fileType.toLowerCase();

  try {
    let extractedText = "";

    switch (normalizedType) {
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
        extractedText = await processSpreadsheet(buffer, normalizedType);
        break;

      case "txt":
        extractedText = await processText(buffer);
        break;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (isSpreadsheetType(normalizedType)) {
      const chunks = chunkSpreadsheet(extractedText);
      console.log(
        `[DocumentProcessor] Spreadsheet: ${chunks.length} row chunks (${normalizedType})`
      );
      return chunks;
    }

    const chunks = chunkText(extractedText);
    console.log(`[DocumentProcessor] Prose: ${chunks.length} chunks (${normalizedType})`);
    return chunks;
  } catch (error) {
    console.error("[DocumentProcessor] Error processing document:", error);
    throw error;
  }
}

const MAX_EMBEDDING_CHARS = 30000;
const EMBEDDING_BATCH_SIZE = 64;
const EMBEDDING_MAX_RETRIES = 5;
const EMBEDDING_MODEL = "text-embedding-3-small";

function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBEDDING_CHARS) return text;
  console.log(`[Embeddings] Truncated text from ${text.length} to ${MAX_EMBEDDING_CHARS} characters`);
  return text.slice(0, MAX_EMBEDDING_CHARS) + "...[truncated]";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  const cause = (error as { cause?: { code?: string } }).cause;
  const retryableCodes = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"];
  if (cause?.code && retryableCodes.includes(cause.code)) return true;
  return msg.includes("fetch failed") || msg.includes("timeout") || msg.includes("429");
}

async function withEmbeddingRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= EMBEDDING_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableFetchError(error) || attempt === EMBEDDING_MAX_RETRIES) {
        throw error;
      }
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 30000);
      console.warn(
        `[Embeddings] ${label} attempt ${attempt}/${EMBEDDING_MAX_RETRIES} failed, retrying in ${delayMs}ms:`,
        error instanceof Error ? error.message : error
      );
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function loadEmbeddingSettings(userId?: number, organizationId?: number) {
  if (!userId || !organizationId) return null;
  try {
    const { getSystemSettings } = await import("./db");
    return await getSystemSettings(userId, organizationId);
  } catch (error) {
    console.warn("[Embeddings] Could not load settings, using OpenAI:", error);
    return null;
  }
}

async function fetchOpenAIEmbeddingsBatch(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  return withEmbeddingRetry(`OpenAI batch (${inputs.length})`, async () => {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: inputs,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const sorted = [...data.data].sort(
      (a: { index: number }, b: { index: number }) => a.index - b.index
    );
    return sorted.map((item: { embedding: number[] }) => item.embedding);
  });
}

/**
 * Generate embeddings for many texts in batches (OpenAI) or sequentially (Ollama)
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  userId?: number,
  organizationId?: number
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const truncated = texts.map(truncateForEmbedding);
  const settings = await loadEmbeddingSettings(userId, organizationId);

  if (settings?.llmProvider === "ollama" && settings.ollamaBaseUrl) {
    const { generateOllamaEmbedding, DEFAULT_OLLAMA_CONFIG } = await import("./ollama");
    const config = {
      ...DEFAULT_OLLAMA_CONFIG,
      baseUrl: settings.ollamaBaseUrl,
      embeddingModel: settings.ollamaEmbeddingModel || DEFAULT_OLLAMA_CONFIG.embeddingModel,
    };

    console.log(`[Embeddings] Ollama sequential: ${truncated.length} texts`);
    const results: number[][] = [];
    for (let i = 0; i < truncated.length; i++) {
      const embedding = await withEmbeddingRetry(`Ollama item ${i + 1}`, () =>
        generateOllamaEmbedding(truncated[i]!, config)
      );
      results.push(embedding);
      if ((i + 1) % 25 === 0 || i === truncated.length - 1) {
        console.log(`[Embeddings] Ollama progress: ${i + 1}/${truncated.length}`);
      }
    }
    return results;
  }

  const results: number[][] = [];
  for (let i = 0; i < truncated.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = truncated.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchEmbeddings = await fetchOpenAIEmbeddingsBatch(batch);
    results.push(...batchEmbeddings);
    console.log(
      `[Embeddings] OpenAI batch progress: ${Math.min(i + batch.length, truncated.length)}/${truncated.length}`
    );
    if (i + EMBEDDING_BATCH_SIZE < truncated.length) {
      await sleep(200);
    }
  }

  return results;
}

/**
 * Generate a single embedding (queries, tests)
 */
export async function generateEmbedding(
  text: string,
  userId?: number,
  organizationId?: number
): Promise<number[]> {
  const [embedding] = await generateEmbeddingsBatch([text], userId, organizationId);
  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }
  return embedding;
}

/**
 * Generate relevant tags for document content using LLM
 */
export async function generateTags(documentContent: string, maxTags: number = 5): Promise<string[]> {
  try {
    const truncatedContent = documentContent.slice(0, 8000);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a document analysis assistant. Generate relevant, concise tags for documents. Return ONLY a JSON array of strings, nothing else.",
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

Return ONLY a JSON array of tag strings, for example: ["imóveis", "vendas", "são paulo"]`,
        },
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
                description: "Array of relevant tags",
              },
            },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
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
