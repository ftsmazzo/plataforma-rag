// Script para testar se uma senha corresponde a um hash
// Execute: node testar-senha.js "senha" "hash"

import bcrypt from "bcryptjs";

const senha = process.argv[2];
const hash = process.argv[3];

if (!senha || !hash) {
  console.error("❌ Uso: node testar-senha.js 'senha' 'hash'");
  process.exit(1);
}

async function testar() {
  try {
    const isValid = await bcrypt.compare(senha, hash);
    if (isValid) {
      console.log("✅ Senha CORRESPONDE ao hash!");
    } else {
      console.log("❌ Senha NÃO corresponde ao hash!");
      console.log("\n💡 Gere um novo hash com: node gerar-hash-senha.js 'sua-senha'");
    }
  } catch (error) {
    console.error("❌ Erro ao testar:", error);
    process.exit(1);
  }
}

testar();
