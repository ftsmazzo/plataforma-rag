import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNull } from "drizzle-orm";
import { organizations, users, documents, documentChunks, embeddings } from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não está configurada");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function migrateToDefaultOrg() {
  console.log("🚀 Iniciando migração para organização padrão...");

  try {
    // 1. Verificar se já existe uma organização padrão
    const existingOrgs = await db.select().from(organizations).limit(1);
    
    let defaultOrgId;
    
    if (existingOrgs.length === 0) {
      console.log("📝 Criando organização padrão...");
      const [newOrg] = await db.insert(organizations).values({
        name: "Organização Padrão",
        slug: "default",
        description: "Organização padrão do sistema",
        isActive: 1,
      });
      
      const [createdOrg] = await db.select().from(organizations).where(eq(organizations.id, newOrg.insertId)).limit(1);
      defaultOrgId = createdOrg.id;
      console.log(`✅ Organização padrão criada com ID: ${defaultOrgId}`);
    } else {
      defaultOrgId = existingOrgs[0].id;
      console.log(`✅ Usando organização existente com ID: ${defaultOrgId}`);
    }

    // 2. Atualizar usuários sem organização
    const usersWithoutOrg = await db.select().from(users).where(isNull(users.organizationId));
    if (usersWithoutOrg.length > 0) {
      console.log(`📝 Atribuindo ${usersWithoutOrg.length} usuário(s) à organização padrão...`);
      await db.update(users)
        .set({ organizationId: defaultOrgId })
        .where(isNull(users.organizationId));
      console.log("✅ Usuários atualizados");
    } else {
      console.log("✅ Todos os usuários já têm organização");
    }

    // 3. Atualizar documentos sem organização
    const docsWithoutOrg = await db.select().from(documents).where(isNull(documents.organizationId));
    if (docsWithoutOrg.length > 0) {
      console.log(`📝 Atribuindo ${docsWithoutOrg.length} documento(s) à organização padrão...`);
      await db.update(documents)
        .set({ organizationId: defaultOrgId })
        .where(isNull(documents.organizationId));
      console.log("✅ Documentos atualizados");
    } else {
      console.log("✅ Todos os documentos já têm organização");
    }

    // 4. Atualizar chunks sem organização
    const chunksWithoutOrg = await db.select().from(documentChunks).where(isNull(documentChunks.organizationId));
    if (chunksWithoutOrg.length > 0) {
      console.log(`📝 Atribuindo ${chunksWithoutOrg.length} chunk(s) à organização padrão...`);
      await db.update(documentChunks)
        .set({ organizationId: defaultOrgId })
        .where(isNull(documentChunks.organizationId));
      console.log("✅ Chunks atualizados");
    } else {
      console.log("✅ Todos os chunks já têm organização");
    }

    // 5. Atualizar embeddings sem organização
    const embeddingsWithoutOrg = await db.select().from(embeddings).where(isNull(embeddings.organizationId));
    if (embeddingsWithoutOrg.length > 0) {
      console.log(`📝 Atribuindo ${embeddingsWithoutOrg.length} embedding(s) à organização padrão...`);
      await db.update(embeddings)
        .set({ organizationId: defaultOrgId })
        .where(isNull(embeddings.organizationId));
      console.log("✅ Embeddings atualizados");
    } else {
      console.log("✅ Todos os embeddings já têm organização");
    }

    console.log("\n🎉 Migração concluída com sucesso!");
    console.log(`\n📊 Resumo:`);
    console.log(`   - Organização padrão ID: ${defaultOrgId}`);
    console.log(`   - Usuários migrados: ${usersWithoutOrg.length}`);
    console.log(`   - Documentos migrados: ${docsWithoutOrg.length}`);
    console.log(`   - Chunks migrados: ${chunksWithoutOrg.length}`);
    console.log(`   - Embeddings migrados: ${embeddingsWithoutOrg.length}`);

  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateToDefaultOrg();
