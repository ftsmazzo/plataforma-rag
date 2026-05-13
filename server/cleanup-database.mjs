/**
 * Script de limpeza do banco de dados
 * Remove dados antigos e órfãos, mantém apenas organização "Fábrica IA"
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNull, notInArray, sql } from "drizzle-orm";
import { 
  organizations, 
  knowledgeBases,
  documents, 
  documentChunks, 
  embeddings,
  users
} from "../drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not configured");
}

const db = drizzle(DATABASE_URL);

async function cleanup() {
  console.log("🧹 Iniciando limpeza do banco de dados...\n");

  try {
    // 1. Encontrar ou criar organização "Fábrica IA"
    console.log("1️⃣ Verificando organização 'Fábrica IA'...");
    let [fabricaIA] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "fabrica-ia"))
      .limit(1);

    if (!fabricaIA) {
      console.log("   Criando organização 'Fábrica IA'...");
      const [result] = await db.insert(organizations).values({
        name: "Fábrica IA",
        slug: "fabrica-ia",
        description: "Organização principal",
        isActive: 1,
      });
      [fabricaIA] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, result.insertId))
        .limit(1);
    }
    console.log(`   ✅ Organização ID: ${fabricaIA.id}\n`);

    // 2. Deletar todas as outras organizações
    console.log("2️⃣ Removendo outras organizações...");
    const deletedOrgs = await db
      .delete(organizations)
      .where(sql`${organizations.id} != ${fabricaIA.id}`);
    console.log(`   ✅ ${deletedOrgs.rowsAffected || 0} organizações removidas\n`);

    // 3. Atualizar usuários sem organização para Fábrica IA
    console.log("3️⃣ Atualizando usuários...");
    const updatedUsers = await db
      .update(users)
      .set({ organizationId: fabricaIA.id })
      .where(isNull(users.organizationId));
    console.log(`   ✅ ${updatedUsers.rowsAffected || 0} usuários atualizados\n`);

    // 4. Deletar documentos de outras organizações
    console.log("4️⃣ Removendo documentos de outras organizações...");
    const deletedDocs = await db
      .delete(documents)
      .where(sql`${documents.organizationId} != ${fabricaIA.id}`);
    console.log(`   ✅ ${deletedDocs.rowsAffected || 0} documentos removidos\n`);

    // 5. Deletar bases de conhecimento de outras organizações
    console.log("5️⃣ Removendo bases de conhecimento de outras organizações...");
    const deletedKBs = await db
      .delete(knowledgeBases)
      .where(sql`${knowledgeBases.organizationId} != ${fabricaIA.id}`);
    console.log(`   ✅ ${deletedKBs.rowsAffected || 0} bases removidas\n`);

    // 6. Encontrar IDs de documentos válidos
    console.log("6️⃣ Limpando chunks órfãos...");
    const validDocs = await db.select({ id: documents.id }).from(documents);
    const validDocIds = validDocs.map(d => d.id);

    if (validDocIds.length > 0) {
      const deletedChunks = await db
        .delete(documentChunks)
        .where(notInArray(documentChunks.documentId, validDocIds));
      console.log(`   ✅ ${deletedChunks.rowsAffected || 0} chunks órfãos removidos\n`);
    } else {
      // Se não há documentos válidos, deletar todos os chunks
      const deletedChunks = await db.delete(documentChunks);
      console.log(`   ✅ ${deletedChunks.rowsAffected || 0} chunks removidos (sem documentos válidos)\n`);
    }

    // 7. Encontrar IDs de chunks válidos
    console.log("7️⃣ Limpando embeddings órfãos...");
    const validChunks = await db.select({ id: documentChunks.id }).from(documentChunks);
    const validChunkIds = validChunks.map(c => c.id);

    if (validChunkIds.length > 0) {
      const deletedEmbeddings = await db
        .delete(embeddings)
        .where(notInArray(embeddings.chunkId, validChunkIds));
      console.log(`   ✅ ${deletedEmbeddings.rowsAffected || 0} embeddings órfãos removidos\n`);
    } else {
      // Se não há chunks válidos, deletar todos os embeddings
      const deletedEmbeddings = await db.delete(embeddings);
      console.log(`   ✅ ${deletedEmbeddings.rowsAffected || 0} embeddings removidos (sem chunks válidos)\n`);
    }

    // 8. Estatísticas finais
    console.log("📊 Estatísticas finais:");
    const [stats] = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM ${organizations}) as orgs,
        (SELECT COUNT(*) FROM ${users}) as users,
        (SELECT COUNT(*) FROM ${knowledgeBases}) as knowledge_bases,
        (SELECT COUNT(*) FROM ${documents}) as docs,
        (SELECT COUNT(*) FROM ${documentChunks}) as chunks,
        (SELECT COUNT(*) FROM ${embeddings}) as embeddings
    `);
    console.log(`   Organizações: ${stats[0].orgs}`);
    console.log(`   Usuários: ${stats[0].users}`);
    console.log(`   Bases de Conhecimento: ${stats[0].knowledge_bases}`);
    console.log(`   Documentos: ${stats[0].docs}`);
    console.log(`   Chunks: ${stats[0].chunks}`);
    console.log(`   Embeddings: ${stats[0].embeddings}`);

    console.log("\n✅ Limpeza concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante limpeza:", error);
    process.exit(1);
  }

  process.exit(0);
}

cleanup();
