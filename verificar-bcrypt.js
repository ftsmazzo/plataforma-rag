// Script para verificar se o bcrypt está funcionando corretamente
// Execute: node verificar-bcrypt.js

import bcrypt from "bcryptjs";

const SENHA_TESTE = "admin123";
const HASH_CORRETO = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

console.log("🔍 Testando bcrypt...\n");

// Teste 1: Verificar se o hash conhecido funciona
console.log("1️⃣ Testando hash conhecido:");
const teste1 = await bcrypt.compare(SENHA_TESTE, HASH_CORRETO);
console.log(`   Senha: ${SENHA_TESTE}`);
console.log(`   Hash: ${HASH_CORRETO.substring(0, 30)}...`);
console.log(`   Resultado: ${teste1 ? "✅ CORRETO" : "❌ INCORRETO"}\n`);

// Teste 2: Gerar novo hash e verificar
console.log("2️⃣ Gerando novo hash:");
const novoHash = await bcrypt.hash(SENHA_TESTE, 10);
console.log(`   Novo hash: ${novoHash}`);
const teste2 = await bcrypt.compare(SENHA_TESTE, novoHash);
console.log(`   Verificação: ${teste2 ? "✅ CORRETO" : "❌ INCORRETO"}\n`);

// Teste 3: Testar com hash que tem espaços
console.log("3️⃣ Testando hash com espaços (simulando problema):");
const hashComEspacos = " " + HASH_CORRETO + " ";
const teste3 = await bcrypt.compare(SENHA_TESTE, hashComEspacos);
console.log(`   Hash com espaços: "${hashComEspacos.substring(0, 32)}..."`);
console.log(`   Verificação: ${teste3 ? "✅ CORRETO" : "❌ INCORRETO (esperado)"}\n`);

// Teste 4: Testar com hash sem espaços
console.log("4️⃣ Testando hash sem espaços:");
const hashSemEspacos = hashComEspacos.trim();
const teste4 = await bcrypt.compare(SENHA_TESTE, hashSemEspacos);
console.log(`   Hash sem espaços: "${hashSemEspacos.substring(0, 32)}..."`);
console.log(`   Verificação: ${teste4 ? "✅ CORRETO" : "❌ INCORRETO"}\n`);

// Resumo
console.log("📊 RESUMO:");
console.log(`   Hash conhecido funciona: ${teste1 ? "✅" : "❌"}`);
console.log(`   Novo hash funciona: ${teste2 ? "✅" : "❌"}`);
console.log(`   Hash com espaços: ${teste3 ? "⚠️ Funciona (inesperado)" : "✅ Falha (esperado)"}`);
console.log(`   Hash sem espaços: ${teste4 ? "✅" : "❌"}`);

if (!teste1) {
  console.log("\n❌ PROBLEMA: O hash conhecido não está funcionando!");
  console.log("   Isso pode indicar:");
  console.log("   - Problema com a biblioteca bcryptjs");
  console.log("   - Hash corrompido no banco");
  console.log("   - Encoding incorreto");
}
