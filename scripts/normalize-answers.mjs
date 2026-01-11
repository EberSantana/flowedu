/**
 * Script de migração para normalizar respostas antigas
 * Converte respostas no formato "C) Texto da resposta" para apenas "C"
 * 
 * Execução: node scripts/normalize-answers.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

// Carregar variáveis de ambiente
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

async function normalizeAnswers() {
  console.log('🚀 Iniciando migração de normalização de respostas...\n');

  // Conectar ao banco de dados
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Buscar todas as respostas que precisam ser normalizadas
    // Respostas no formato "A) ...", "B) ...", "C) ...", "D) ..."
    const [answers] = await connection.execute(`
      SELECT id, studentAnswer, correctAnswer
      FROM student_exercise_answers
      WHERE (studentAnswer LIKE 'A)%' OR studentAnswer LIKE 'B)%' OR studentAnswer LIKE 'C)%' OR studentAnswer LIKE 'D)%')
         OR (correctAnswer LIKE 'A)%' OR correctAnswer LIKE 'B)%' OR correctAnswer LIKE 'C)%' OR correctAnswer LIKE 'D)%')
    `);

    console.log(`📊 Encontradas ${answers.length} respostas para normalizar\n`);

    if (answers.length === 0) {
      console.log('✅ Nenhuma resposta precisa ser normalizada!');
      await connection.end();
      return;
    }

    let updatedCount = 0;

    // Processar cada resposta
    for (const answer of answers) {
      const { id, studentAnswer, correctAnswer } = answer;
      
      // Extrair apenas a letra da resposta (A, B, C ou D)
      const normalizedStudentAnswer = studentAnswer?.match(/^[A-D]/)?.[0] || studentAnswer;
      const normalizedCorrectAnswer = correctAnswer?.match(/^[A-D]/)?.[0] || correctAnswer;

      // Atualizar apenas se houve mudança
      if (normalizedStudentAnswer !== studentAnswer || normalizedCorrectAnswer !== correctAnswer) {
        await connection.execute(
          `UPDATE student_exercise_answers
           SET studentAnswer = ?,
               correctAnswer = ?
           WHERE id = ?`,
          [normalizedStudentAnswer, normalizedCorrectAnswer, id]
        );

        updatedCount++;
        
        console.log(`✓ ID ${id}:`);
        if (normalizedStudentAnswer !== studentAnswer) {
          console.log(`  Resposta do aluno: "${studentAnswer}" → "${normalizedStudentAnswer}"`);
        }
        if (normalizedCorrectAnswer !== correctAnswer) {
          console.log(`  Resposta correta: "${correctAnswer}" → "${normalizedCorrectAnswer}"`);
        }
      }
    }

    console.log(`\n✅ Migração concluída com sucesso!`);
    console.log(`📈 Total de respostas atualizadas: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão com banco de dados fechada');
  }
}

// Executar migração
normalizeAnswers()
  .then(() => {
    console.log('\n🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na execução:', error);
    process.exit(1);
  });
