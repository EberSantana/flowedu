import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') });

const BADGES = [
  // Badges de Exercícios
  {
    code: 'first_exercise',
    name: 'Primeira Questão',
    description: 'Complete seu primeiro exercício',
    icon: '🎯',
    category: 'exercise'
  },
  {
    code: 'exercise_master_10',
    name: 'Mestre dos Exercícios',
    description: 'Complete 10 exercícios',
    icon: '📚',
    category: 'exercise'
  },
  {
    code: 'exercise_master_50',
    name: 'Expert em Exercícios',
    description: 'Complete 50 exercícios',
    icon: '🎓',
    category: 'exercise'
  },
  
  // Badges de Provas
  {
    code: 'first_exam',
    name: 'Primeira Prova',
    description: 'Complete sua primeira prova',
    icon: '📝',
    category: 'exam'
  },
  {
    code: 'perfect_score',
    name: 'Nota Perfeita',
    description: 'Tire 10 em uma prova',
    icon: '💯',
    category: 'exam'
  },
  {
    code: 'speedster_15',
    name: 'Velocista',
    description: 'Complete uma prova em menos de 15 minutos',
    icon: '⚡',
    category: 'exam'
  },
  {
    code: 'speedster_30',
    name: 'Rápido',
    description: 'Complete uma prova em menos de 30 minutos',
    icon: '🏃',
    category: 'exam'
  },
  
  // Badges de Streak
  {
    code: 'fire_streak_7',
    name: 'Semana de Fogo',
    description: 'Mantenha 7 dias consecutivos de atividade',
    icon: '🔥',
    category: 'streak'
  },
  {
    code: 'fire_streak_30',
    name: 'Mês Incandescente',
    description: 'Mantenha 30 dias consecutivos de atividade',
    icon: '🌟',
    category: 'streak'
  },
  {
    code: 'fire_streak_100',
    name: 'Centenário',
    description: 'Mantenha 100 dias consecutivos de atividade',
    icon: '💎',
    category: 'streak'
  },
  
  // Badges Especiais
  {
    code: 'early_bird',
    name: 'Madrugador',
    description: 'Complete atividades antes das 7h',
    icon: '🌅',
    category: 'special'
  },
  {
    code: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Complete atividades depois das 22h',
    icon: '🦉',
    category: 'special'
  },
  {
    code: 'weekend_warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Complete atividades no sábado e domingo',
    icon: '⚔️',
    category: 'special'
  },
  {
    code: 'top_3',
    name: 'Top 3',
    description: 'Fique entre os 3 primeiros do ranking',
    icon: '🏆',
    category: 'special'
  },
  {
    code: 'champion',
    name: 'Campeão',
    description: 'Alcance o 1º lugar no ranking',
    icon: '👑',
    category: 'special'
  },
];

async function seedBadges() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🗑️  Limpando badges existentes...');
    await connection.execute('DELETE FROM badges');
    
    console.log('🌱 Inserindo badges...');
    
    for (const badge of BADGES) {
      await connection.execute(
        `INSERT INTO badges (code, name, description, icon, category) VALUES (?, ?, ?, ?, ?)`,
        [badge.code, badge.name, badge.description, badge.icon, badge.category]
      );
      console.log(`  ✅ ${badge.icon} ${badge.name}`);
    }
    
    console.log(`\n✨ ${BADGES.length} badges inseridos com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao popular badges:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

seedBadges();
