// Script para gerar um novo hash para "admin123"
// Execute no container: node gerar-hash-novo.js

import bcrypt from "bcryptjs";

const SENHA = "admin123";

async function gerarHash() {
  console.log("🔐 Gerando novo hash para senha: admin123\n");
  
  // Gerar hash
  const hash = await bcrypt.hash(SENHA, 10);
  
  // Verificar se funciona
  const isValid = await bcrypt.compare(SENHA, hash);
  
  console.log("✅ Hash gerado com sucesso!");
  console.log(`\nHash: ${hash}\n`);
  console.log(`Verificação: ${isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}\n`);
  
  console.log("📋 SQL para atualizar no banco:");
  console.log("─".repeat(70));
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'fredmazzo@gmail.com';`);
  console.log("─".repeat(70));
  console.log("\n💡 Execute este SQL no banco de dados e depois faça login com:");
  console.log("   Email: fredmazzo@gmail.com");
  console.log("   Senha: admin123\n");
}

gerarHash().catch(console.error);
