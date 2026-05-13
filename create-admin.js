// Script Node.js para criar um usuário admin
// Execute: node create-admin.js

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { pg } from "pg";
import { users, organizations } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada");
  process.exit(1);
}

// Configuração do admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador";

async function createAdmin() {
  console.log("🚀 Criando usuário admin...");

  try {
    // Conectar ao banco
    const pool = new pg.Pool({
      connectionString: DATABASE_URL,
    });
    const db = drizzle(pool);

    // Verificar ou criar organização padrão
    let org = await db.select().from(organizations).where(eq(organizations.slug, "default")).limit(1);
    
    let orgId;
    if (org.length === 0) {
      console.log("📝 Criando organização padrão...");
      const [newOrg] = await db.insert(organizations).values({
        name: "Organização Padrão",
        slug: "default",
        description: "Organização padrão do sistema",
        isActive: true,
      }).returning();
      orgId = newOrg.id;
      console.log(`✅ Organização criada com ID: ${orgId}`);
    } else {
      orgId = org[0].id;
      console.log(`✅ Usando organização existente com ID: ${orgId}`);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Verificar se usuário já existe
    const existingUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

    if (existingUser.length > 0) {
      // Atualizar usuário existente para admin
      await db.update(users)
        .set({
          password: hashedPassword,
          role: "admin",
          organizationId: orgId,
        })
        .where(eq(users.email, ADMIN_EMAIL));
      
      console.log("✅ Usuário existente atualizado para admin!");
    } else {
      // Criar novo usuário admin
      const [newUser] = await db.insert(users).values({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: "admin",
        organizationId: orgId,
      }).returning();

      console.log("✅ Usuário admin criado com sucesso!");
      console.log(`   ID: ${newUser.id}`);
    }

    console.log("\n📋 Credenciais do Admin:");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    process.exit(1);
  }
}

createAdmin();
