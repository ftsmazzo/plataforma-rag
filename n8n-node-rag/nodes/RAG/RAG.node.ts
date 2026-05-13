import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class RAG implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'FabricaIa-RAG',
    name: 'rag',
    icon: 'file:rag.svg',
    iconColor: '#6366F1' as any,
    group: ['transform'] as any,
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Query your RAG Knowledge Base with semantic search',
    defaults: {
      name: 'FabricaIa-RAG',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'ragApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Query Knowledge Base',
            value: 'query',
            description: 'Search and get AI answer from a knowledge base',
            action: 'Query a knowledge base',
          },
          {
            name: 'List Knowledge Bases',
            value: 'list',
            description: 'Get all available knowledge bases',
            action: 'List all knowledge bases',
          },
        ],
        default: 'query',
      },
      {
        displayName: 'Knowledge Base',
        name: 'knowledgeBaseId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getKnowledgeBases',
        },
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        default: '',
        required: true,
        description: 'Select the knowledge base to query',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        default: '',
        required: true,
        placeholder: 'What is the refund policy?',
        description: 'Your question or search query',
      },
      {
        displayName: 'Top K Results',
        name: 'topK',
        type: 'number',
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        default: 5,
        description: 'Number of most relevant results to return (1-20)',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getKnowledgeBases(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('ragApi');
        const apiUrl = credentials.apiUrl as string;

        try {
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${apiUrl}/api/knowledge-bases`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.success && Array.isArray(response.data)) {
            // Filter active knowledge bases (handle both boolean and numeric)
            const activeBases = response.data.filter((kb: any) => {
              const isActive = kb.isActive === true || kb.isActive === 1 || kb.isActive === 'true';
              return isActive;
            });
            
            return activeBases.map((kb: any) => ({
              name: kb.name,
              value: kb.id,
            }));
          }

          return [];
        } catch (error) {
          console.error('Error loading knowledge bases:', error);
          return [];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;
    const credentials = await this.getCredentials('ragApi');
    const apiUrl = credentials.apiUrl as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'list') {
          // List knowledge bases
          const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${apiUrl}/api/knowledge-bases`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.success && Array.isArray(response.data)) {
            returnData.push({
              json: {
                knowledgeBases: response.data,
                count: response.data.length,
              },
            });
          } else {
            returnData.push({
              json: {
                error: 'Failed to fetch knowledge bases',
                response,
              },
            });
          }
        } else if (operation === 'query') {
          // Query knowledge base
          const knowledgeBaseIdParam = this.getNodeParameter('knowledgeBaseId', i);
          // Ensure it's a number (handle both string and number from options)
          const knowledgeBaseId = typeof knowledgeBaseIdParam === 'string' 
            ? parseInt(knowledgeBaseIdParam, 10) 
            : Number(knowledgeBaseIdParam);
          
          const query = this.getNodeParameter('query', i) as string;
          const topK = this.getNodeParameter('topK', i, 5) as number;

          if (!knowledgeBaseId || isNaN(knowledgeBaseId)) {
            throw new Error('Invalid knowledge base ID. Please select a knowledge base.');
          }

          const response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${apiUrl}/api/kb/${knowledgeBaseId}/query`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: {
              query,
              topK,
            },
          });

          // Handle both direct data response and wrapped success response
          if (response.success && response.data) {
            returnData.push({
              json: {
                answer: response.data.answer,
                sources: response.data.sources || [],
                knowledgeBase: response.data.knowledgeBase || {},
                query,
                topK,
              },
            });
          } else if (response.answer) {
            // Direct response format (fallback)
            returnData.push({
              json: {
                answer: response.answer,
                sources: response.sources || [],
                knowledgeBase: response.knowledgeBase || {},
                query,
                topK,
              },
            });
          } else {
            returnData.push({
              json: {
                error: response.error || 'Query failed',
                response,
              },
            });
          }
        }
      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message || 'Unknown error',
              details: error.response?.data || error,
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
