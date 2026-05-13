// Testar se o hash específico corresponde à senha
import bcrypt from "bcryptjs";

const HASH_DO_BANCO = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const SENHA_TESTE = "admin123";

console.log("🔍 Testando hash específico...");
console.log(`Hash: ${HASH_DO_BANCO}`);
console.log(`Senha: ${SENHA_TESTE}\n`);

const resultado = await bcrypt.compare(SENHA_TESTE, HASH_DO_BANCO);
console.log(`Resultado: ${resultado ? "✅ CORRETO" : "❌ INCORRETO"}\n`);

if (!resultado) {
  console.log("❌ Este hash NÃO corresponde à senha 'admin123'");
  console.log("📝 Gerando novo hash para 'admin123'...\n");
  
  const novoHash = await bcrypt.hash(SENHA_TESTE, 10);
  console.log(`✅ Novo hash gerado:`);
  console.log(novoHash);
  console.log("\n📋 Use este hash no UPDATE SQL:");
  console.log(`UPDATE users SET password = '${novoHash}' WHERE email = 'fredmazzo@gmail.com';`);
  
  // Testar o novo hash
  const testeNovoHash = await bcrypt.compare(SENHA_TESTE, novoHash);
  console.log(`\n✅ Novo hash testado: ${testeNovoHash ? "FUNCIONA" : "NÃO FUNCIONA"}`);
}
