import mysql from 'mysql2/promise';

const badges = [
  {
    name: 'Mestre da Lógica',
    description: 'Alcançou 80+ pontos em Algoritmos',
    dimension: 'algorithms',
    requirement: JSON.stringify({ dimension: 'algorithms', minScore: 80 }),
    icon: '🧠',
    color: 'orange',
    points: 50,
  },
  {
    name: 'Caçador de Padrões',
    description: 'Alcançou 80+ pontos em Reconhecimento de Padrões',
    dimension: 'pattern_recognition',
    requirement: JSON.stringify({ dimension: 'pattern_recognition', minScore: 80 }),
    icon: '🔍',
    color: 'green',
    points: 50,
  },
  {
    name: 'Simplificador',
    description: 'Alcançou 80+ pontos em Abstração',
    dimension: 'abstraction',
    requirement: JSON.stringify({ dimension: 'abstraction', minScore: 80 }),
    icon: '✨',
    color: 'purple',
    points: 50,
  },
  {
    name: 'Quebra-Cabeças',
    description: 'Alcançou 80+ pontos em Decomposição',
    dimension: 'decomposition',
    requirement: JSON.stringify({ dimension: 'decomposition', minScore: 80 }),
    icon: '🧩',
    color: 'blue',
    points: 50,
  },
  {
    name: 'Pensador Completo',
    description: 'Alcançou 70+ pontos em todas as 4 dimensões',
    dimension: 'all',
    requirement: JSON.stringify({ allDimensions: true, minScore: 70 }),
    icon: '🏆',
    color: 'gold',
    points: 100,
  },
];

async function seedBadges() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🏅 Inserindo badges de Pensamento Computacional...\n');
  
  for (const badge of badges) {
    try {
      await connection.execute(
        `INSERT INTO ct_badges (name, description, dimension, requirement, icon, color, points, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         requirement = VALUES(requirement),
         icon = VALUES(icon),
         color = VALUES(color),
         points = VALUES(points)`,
        [
          badge.name,
          badge.description,
          badge.dimension,
          badge.requirement,
          badge.icon,
          badge.color,
          badge.points,
        ]
      );
      console.log(`✅ ${badge.icon} ${badge.name} (${badge.dimension})`);
    } catch (error) {
      console.error(`❌ Erro ao inserir "${badge.name}":`, error.message);
    }
  }
  
  console.log(`\n✨ Total: ${badges.length} badges inseridos!`);
  
  await connection.end();
}

seedBadges().catch(console.error);
