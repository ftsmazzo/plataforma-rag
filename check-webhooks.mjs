import { db } from "./server/db.ts";
import { knowledgeBases } from "./drizzle/schema.ts";

const bases = await db.select().from(knowledgeBases);
console.log("Bases de Conhecimento:");
console.log(JSON.stringify(bases, null, 2));
