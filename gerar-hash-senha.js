// Script para gerar hash bcrypt de uma senha
// Execute: node gerar-hash-senha.js "sua-senha"

import bcrypt from "bcryptjs";

const senha = process.argv[2] || "admin123";

async function gerarHash() {
  try {
    const hash = await bcrypt.hash(senha, 10);
    console.log("\n✅ Hash gerado com sucesso!");
    console.log("\n📋 Informações:");
    console.log(`   Senha: ${senha}`);
    console.log(`   Hash: ${hash}`);
    console.log("\n💡 Use este hash no SQL para criar o usuário admin:");
    console.log(`\n   '$2a$10$...' → '${hash}'`);
    console.log("\n");
    
    // Verificar se o hash está correto
    const isValid = await bcrypt.compare(senha, hash);
    console.log(`✅ Verificação: Hash é válido? ${isValid ? 'SIM' : 'NÃO'}`);
  } catch (error) {
    console.error("❌ Erro ao gerar hash:", error);
    process.exit(1);
  }
}

gerarHash();
