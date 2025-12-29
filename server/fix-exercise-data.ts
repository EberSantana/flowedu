/**
 * Script de migração para corrigir exerciseData que foram salvos como string
 * 
 * Problema: Alguns exercícios foram salvos com exerciseData como string JSON
 * em vez de objeto JSON, causando erro ao tentar acessar as questões.
 * 
 * Solução: Converter todos os exerciseData de string para objeto JSON.
 */

import { getDb } from "./db";

async function fixExerciseData() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  const { studentExercises } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  console.log("🔍 Buscando exercícios no banco de dados...");

  // Buscar todos os exercícios
  const exercises = await db.select().from(studentExercises);

  console.log(`📊 Total de exercícios encontrados: ${exercises.length}`);

  let fixed = 0;
  let alreadyCorrect = 0;
  let errors = 0;

  for (const exercise of exercises) {
    try {
      const exerciseData = exercise.exerciseData;

      // Verificar se é string
      if (typeof exerciseData === "string") {
        console.log(`🔧 Corrigindo exercício ID ${exercise.id}: "${exercise.title}"`);

        // Tentar fazer parse do JSON
        let parsedData;
        try {
          parsedData = JSON.parse(exerciseData);
        } catch (parseError) {
          console.error(`❌ Erro ao fazer parse do JSON do exercício ${exercise.id}:`, parseError);
          errors++;
          continue;
        }

        // Atualizar no banco de dados
        await db
          .update(studentExercises)
          .set({ exerciseData: parsedData })
          .where(eq(studentExercises.id, exercise.id));

        console.log(`✅ Exercício ${exercise.id} corrigido com sucesso`);
        fixed++;
      } else if (typeof exerciseData === "object" && exerciseData !== null) {
        // Já está correto
        alreadyCorrect++;
      } else {
        console.warn(`⚠️  Exercício ${exercise.id} tem exerciseData em formato inesperado:`, typeof exerciseData);
        errors++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar exercício ${exercise.id}:`, error);
      errors++;
    }
  }

  console.log("\n📈 Resumo da migração:");
  console.log(`   ✅ Exercícios corrigidos: ${fixed}`);
  console.log(`   ✓  Já estavam corretos: ${alreadyCorrect}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📊 Total processado: ${exercises.length}`);

  if (fixed > 0) {
    console.log("\n🎉 Migração concluída com sucesso!");
  } else if (errors === 0) {
    console.log("\n✨ Todos os exercícios já estavam no formato correto!");
  } else {
    console.log("\n⚠️  Migração concluída com alguns erros. Verifique os logs acima.");
  }
}

// Executar migração
fixExerciseData()
  .then(() => {
    console.log("\n✅ Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
