import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class RAGApi implements ICredentialType {
  name = 'ragApi';
  displayName = 'RAG API';
  documentationUrl = 'https://github.com/ftsmazzo/sistema-rag';
  properties: INodeProperties[] = [
    {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: '',
      placeholder: 'https://seu-app.easypanel.host',
      required: true,
      description: 'URL base da sua instalação RAG',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Sua API Key (sk_...)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        'Content-Type': 'application/json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl}}',
      url: '/api/knowledge-bases',
      method: 'GET',
    },
  };
}
