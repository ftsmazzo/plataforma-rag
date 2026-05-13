// Script para testar login e verificar se a senha está correta
// Execute: node testar-login.js "email" "senha"

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const EMAIL = process.argv[2] || "fredmazzo@gmail.com";
const SENHA = process.argv[3];

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está configurada");
  process.exit(1);
}

if (!SENHA) {
  console.error("❌ Uso: node testar-login.js 'email' 'senha'");
  console.error("   Exemplo: node testar-login.js 'fredmazzo@gmail.com' 'admin123'");
  process.exit(1);
}

async function testarLogin() {
  console.log("🔍 Testando login...");
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Senha: ${SENHA}\n`);

  try {
    // Conectar ao banco
    const pool = new Pool({
      connectionString: DATABASE_URL,
    });
    const db = drizzle(pool);

    // Buscar usuário
    console.log("1️⃣ Buscando usuário no banco...");
    const [usuario] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);

    if (!usuario) {
      console.error(`❌ Usuário com email ${EMAIL} não encontrado!`);
      await pool.end();
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Nome: ${usuario.name}`);
    console.log(`   Role: ${usuario.role}`);
    console.log(`   Hash no banco: ${usuario.password.substring(0, 30)}...`);

    // Verificar senha
    console.log("\n2️⃣ Verificando senha...");
    const isValid = await bcrypt.compare(SENHA, usuario.password);

    if (isValid) {
      console.log("✅ Senha CORRETA! O login deve funcionar.");
    } else {
      console.log("❌ Senha INCORRETA!");
      console.log("\n💡 Soluções:");
      console.log("   1. Atualize a senha com: node atualizar-senha-admin.js 'email' 'nova-senha'");
      console.log("   2. Ou gere um novo hash e atualize via SQL:");
      console.log(`      node gerar-hash-senha.js "${SENHA}"`);
    }

    // Testar gerar novo hash
    console.log("\n3️⃣ Gerando novo hash para comparação...");
    const novoHash = await bcrypt.hash(SENHA, 10);
    console.log(`   Novo hash: ${novoHash}`);
    
    const novoHashValido = await bcrypt.compare(SENHA, novoHash);
    console.log(`   Novo hash é válido? ${novoHashValido ? 'SIM ✅' : 'NÃO ❌'}`);

    if (!isValid) {
      console.log("\n📝 Para corrigir, execute:");
      console.log(`   UPDATE users SET password = '${novoHash}' WHERE email = '${EMAIL}';`);
    }

    await pool.end();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error("❌ Erro ao testar login:", error);
    process.exit(1);
  }
}

testarLogin();
