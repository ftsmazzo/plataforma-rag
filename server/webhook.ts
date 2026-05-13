/**
 * Webhook notification system
 * Sends HTTP POST requests to configured webhook URLs
 */

interface WebhookPayload {
  event: "document.processed" | "document.failed";
  timestamp: string;
  knowledgeBase: {
    id: number;
    name: string;
  };
  document: {
    id: number;
    filename: string;
    fileSize: number;
    status: string;
    totalChunks?: number;
    errorMessage?: string;
  };
  stats?: {
    processingTime?: number;
    chunksCreated?: number;
    embeddingsCreated?: number;
  };
}

export async function sendWebhook(webhookUrl: string, payload: WebhookPayload): Promise<boolean> {
  try {
    console.log(`[Webhook] Sending webhook to ${webhookUrl}`, JSON.stringify(payload, null, 2));
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RAG-Knowledge-Base/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error(`[Webhook] Failed to send webhook to ${webhookUrl}: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log(`[Webhook] Successfully sent webhook to ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error(`[Webhook] Error sending webhook to ${webhookUrl}:`, error);
    return false;
  }
}

export async function notifyDocumentProcessed(
  webhookUrl: string,
  knowledgeBase: { id: number; name: string },
  document: {
    id: number;
    filename: string;
    fileSize: number;
    totalChunks: number;
  },
  stats?: {
    processingTime?: number;
    chunksCreated?: number;
    embeddingsCreated?: number;
  }
): Promise<boolean> {
  const payload: WebhookPayload = {
    event: "document.processed",
    timestamp: new Date().toISOString(),
    knowledgeBase,
    document: {
      id: document.id,
      filename: document.filename,
      fileSize: document.fileSize,
      status: "completed",
      totalChunks: document.totalChunks,
    },
    stats,
  };

  return await sendWebhook(webhookUrl, payload);
}

export async function notifyDocumentFailed(
  webhookUrl: string,
  knowledgeBase: { id: number; name: string },
  document: {
    id: number;
    filename: string;
    fileSize: number;
  },
  errorMessage: string
): Promise<boolean> {
  const payload: WebhookPayload = {
    event: "document.failed",
    timestamp: new Date().toISOString(),
    knowledgeBase,
    document: {
      id: document.id,
      filename: document.filename,
      fileSize: document.fileSize,
      status: "failed",
      errorMessage,
    },
  };

  return await sendWebhook(webhookUrl, payload);
}
