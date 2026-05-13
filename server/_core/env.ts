export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // MinIO Configuration
  minioEndpoint: process.env.MINIO_ENDPOINT ?? "localhost",
  minioPort: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  minioUseSSL: process.env.MINIO_USE_SSL === "true",
  minioAccessKey: process.env.MINIO_ACCESS_KEY ?? "",
  minioSecretKey: process.env.MINIO_SECRET_KEY ?? "",
  minioBucketName: process.env.MINIO_BUCKET_NAME ?? "rag-documents",
};
