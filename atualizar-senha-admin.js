// Script para atualizar a senha do admin
// Execute: node atualizar-senha-admin.js "email" "nova-senha"

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const EMAIL = process.argv[2] || "fredmazzo@gmail.com";
const NOVA_SENHA = process.argv[3];

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada");
  process.exit(1);
}

if (!NOVA_SENHA) {
  console.error("❌ Uso: node atualizar-senha-admin.js 'email' 'nova-senha'");
  console.error("   Exemplo: node atualizar-senha-admin.js 'fredmazzo@gmail.com' 'admin123'");
  process.exit(1);
}

async function atualizarSenha() {
  console.log("🔐 Atualizando senha do admin...");
  console.log(`   Email: ${EMAIL}`);

  try {
    // Conectar ao banco
    const pool = new Pool({
      connectionString: DATABASE_URL,
    });
    const db = drizzle(pool);

    // Verificar se usuário existe
    const [usuario] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);

    if (!usuario) {
      console.error(`❌ Usuário com email ${EMAIL} não encontrado!`);
      await pool.end();
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${usuario.name} (role: ${usuario.role})`);

    // Gerar novo hash
    const novoHash = await bcrypt.hash(NOVA_SENHA, 10);
    console.log(`\n📝 Novo hash gerado: ${novoHash.substring(0, 30)}...`);

    // Atualizar senha
    await db
      .update(users)
      .set({
        password: novoHash,
        updatedAt: new Date(),
      })
      .where(eq(users.email, EMAIL));

    console.log("✅ Senha atualizada com sucesso!");
    console.log("\n📋 Credenciais:");
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Senha: ${NOVA_SENHA}`);
    console.log("\n💡 Agora você pode fazer login com essas credenciais!");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao atualizar senha:", error);
    process.exit(1);
  }
}

atualizarSenha();
