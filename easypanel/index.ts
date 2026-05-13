import { Output, randomPassword, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // PostgreSQL Database with pgvector
  services.push({
    type: "postgres",
    data: {
      projectName: input.projectName,
      serviceName: input.databaseServiceName,
      password: randomPassword(),
    },
  });

  // MinIO Object Storage
  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: "minio",
      source: {
        type: "image",
        image: "minio/minio:latest",
      },
      env: [
        `MINIO_ROOT_USER=${input.minioAccessKey || "minioadmin"}`,
        `MINIO_ROOT_PASSWORD=${input.minioSecretKey || randomPassword()}`,
      ].join("\n"),
      mounts: [
        {
          type: "volume",
          name: "minio-data",
          mountPath: "/data",
        },
      ],
      command: "server /data --console-address \":9001\"",
      ports: [
        {
          published: 9000,
          target: 9000,
        },
        {
          published: 9001,
          target: 9001,
        },
      ],
    },
  });

  // RAG Knowledge Base Application
  services.push({
    type: "app",
    data: {
      projectName: input.projectName,
      serviceName: input.appServiceName,
      source: {
        type: "image",
        image: input.appServiceImage,
      },
      domains: [
        {
          host: "$(EASYPANEL_DOMAIN)",
          port: 3000,
        },
      ],
      env: [
        // Database Connection (PostgreSQL)
        `DATABASE_URL=postgresql://postgres:$(PROJECT_GENERATED_PASSWORD_${input.databaseServiceName})@$(PROJECT_NAME)_${input.databaseServiceName}:5432/$(PROJECT_NAME)`,
        
        // OpenAI API
        `OPENAI_API_KEY=${input.openaiApiKey}`,
        
        // JWT & Auth
        `JWT_SECRET=${randomPassword()}`,
        
        // MinIO Configuration
        `MINIO_ENDPOINT=$(PROJECT_NAME)_minio`,
        `MINIO_PORT=9000`,
        `MINIO_USE_SSL=false`,
        `MINIO_ACCESS_KEY=${input.minioAccessKey || "minioadmin"}`,
        `MINIO_SECRET_KEY=${input.minioSecretKey || randomPassword()}`,
        `MINIO_BUCKET_NAME=rag-documents`,
        
        // App Configuration
        `VITE_APP_ID=rag-knowledge-base`,
        `VITE_APP_TITLE=RAG Knowledge Base`,
        `VITE_APP_LOGO=`,
        
        // Node Environment
        `NODE_ENV=production`,
      ].join("\n"),
      mounts: [
        {
          type: "volume",
          name: "data",
          mountPath: "/app/data",
        },
      ],
    },
  });

  return { services };
}
