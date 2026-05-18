// Script Node.js para criar um usuário admin (sem dependência de drizzle compilado)
// Execute: node create-admin.js

import bcrypt from "bcryptjs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrador";

async function createAdmin() {
  console.log("🚀 Criando usuário admin...");

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const orgResult = await pool.query(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      ["default"]
    );

    let orgId;
    if (orgResult.rows.length === 0) {
      console.log("📝 Criando organização padrão...");
      const insertOrg = await pool.query(
        `INSERT INTO organizations (name, slug, description, "isActive")
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        ["Organização Padrão", "default", "Organização padrão do sistema"]
      );
      orgId = insertOrg.rows[0].id;
      console.log(`✅ Organização criada com ID: ${orgId}`);
    } else {
      orgId = orgResult.rows[0].id;
      console.log(`✅ Usando organização existente com ID: ${orgId}`);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [ADMIN_EMAIL]
    );

    if (userResult.rows.length > 0) {
      await pool.query(
        `UPDATE users SET password = $1, role = 'admin', "organizationId" = $2, "updatedAt" = NOW()
         WHERE email = $3`,
        [hashedPassword, orgId, ADMIN_EMAIL]
      );
      console.log("✅ Usuário existente atualizado para admin!");
    } else {
      const insertUser = await pool.query(
        `INSERT INTO users (email, password, name, role, "organizationId")
         VALUES ($1, $2, $3, 'admin', $4)
         RETURNING id`,
        [ADMIN_EMAIL, hashedPassword, ADMIN_NAME, orgId]
      );
      console.log("✅ Usuário admin criado com sucesso!");
      console.log(`   ID: ${insertUser.rows[0].id}`);
    }

    console.log("\n📋 Credenciais do Admin:");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log("\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
