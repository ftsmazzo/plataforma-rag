/**
 * Ollama Integration Module
 * Provides functions to interact with local Ollama instance
 * URL: https://llm.fabricadosdados.online
 */

export interface OllamaConfig {
  baseUrl: string;
  embeddingModel: string;
  chatModel: string;
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "https://llm.fabricadosdados.online",
  embeddingModel: "nomic-embed-text",
  chatModel: "llama3.2:1b",
};

/**
 * Test connection to Ollama server
 */
export async function testOllamaConnection(baseUrl: string = DEFAULT_OLLAMA_CONFIG.baseUrl): Promise<{ success: boolean; models?: any[]; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = `Connection failed: ${response.status} ${response.statusText}`;
      console.error("[Ollama]", error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log("[Ollama] Connection successful, available models:", data.models?.map((m: any) => m.name));
    return { success: true, models: data.models };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Ollama] Connection test error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Generate embeddings using Ollama
 * @param text Text to generate embeddings for
 * @param config Ollama configuration
 * @returns Array of numbers representing the embedding vector
 */
export async function generateOllamaEmbedding(
  text: string,
  config: OllamaConfig = DEFAULT_OLLAMA_CONFIG
): Promise<number[]> {
  try {
    // Truncate text to fit in Ollama's context window
    // nomic-embed-text has max context of 2048 tokens (~8000 characters)
    // With num_batch=num_ctx=2048, we can handle larger inputs
    const MAX_CHARS = 8000;  // ~2000 tokens
    const truncatedText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
    
    if (text.length > MAX_CHARS) {
      console.log(`[Ollama] Text truncated from ${text.length} to ${MAX_CHARS} characters`);
    }
    
    const endpoint = `${config.baseUrl}/api/embed`;
    console.log(`[Ollama] Making request to: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: truncatedText,  // Use 'input' instead of 'prompt'
        truncate: true,        // Auto-truncate if too large
        keep_alive: "5m",      // Keep model loaded for 5 minutes
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // /api/embed returns { embeddings: [[...]] } instead of { embedding: [...] }
    if (!data.embeddings || !Array.isArray(data.embeddings) || data.embeddings.length === 0) {
      throw new Error("Invalid embedding response from Ollama");
    }

    // Return first embedding (we only sent one input)
    return data.embeddings[0];
  } catch (error) {
    console.error("[Ollama] Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate chat completion using Ollama
 * @param messages Array of chat messages
 * @param config Ollama configuration
 * @returns Generated response text
 */
export async function generateOllamaChatCompletion(
  messages: Array<{ role: string; content: string }>,
  config: OllamaConfig = DEFAULT_OLLAMA_CONFIG
): Promise<string> {
  try {
    // Convert messages to single prompt (Ollama doesn't support chat format in generate endpoint)
    const prompt = messages
      .map(m => {
        if (m.role === "system") return `System: ${m.content}`;
        if (m.role === "user") return `User: ${m.content}`;
        if (m.role === "assistant") return `Assistant: ${m.content}`;
        return m.content;
      })
      .join("\n\n");

    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.chatModel,
        prompt: prompt + "\n\nAssistant:",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error("Invalid response from Ollama");
    }

    return data.response;
  } catch (error) {
    console.error("[Ollama] Error generating chat completion:", error);
    throw error;
  }
}

/**
 * Get list of available models from Ollama
 */
export async function getOllamaModels(baseUrl: string = DEFAULT_OLLAMA_CONFIG.baseUrl): Promise<Array<{ name: string; size?: number; modified_at?: string }>> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error("[Ollama] Error getting models:", error);
    throw error;
  }
}

/**
 * Check if Ollama is available and healthy
 */
export async function isOllamaAvailable(baseUrl: string = DEFAULT_OLLAMA_CONFIG.baseUrl): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
