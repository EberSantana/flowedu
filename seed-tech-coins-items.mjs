import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('[Seed] Populating shop with Tech Coins items...');

try {
  // Inserir novos itens com sistema de raridade e Tech Coins
  await connection.query(`
    INSERT IGNORE INTO shop_items (name, description, category, price, rarity, requiredBelt, requiredPoints, stock, sortOrder, metadata, isActive)
    VALUES
    -- Power-ups
    ('Dobro de XP (1h)', 'Ganhe o dobro de Tech Coins por 1 hora', 'power_up', 100, 'common', 'white', 0, -1, 100, '{"duration": 3600, "multiplier": 2}', 1),
    ('Triplo de XP (1h)', 'Ganhe o triplo de Tech Coins por 1 hora', 'power_up', 250, 'rare', 'green', 500, -1, 101, '{"duration": 3600, "multiplier": 3}', 1),
    ('Dica Extra', 'Receba uma dica adicional em exercícios difíceis', 'power_up', 50, 'common', 'white', 0, -1, 102, '{"type": "hint"}', 1),
    ('Segunda Chance', 'Tente novamente sem perder pontos', 'power_up', 150, 'rare', 'yellow', 200, -1, 103, '{"type": "retry"}', 1),
    
    -- Certificados especiais
    ('Certificado de Excelência', 'Certificado digital de excelência acadêmica', 'certificate', 500, 'epic', 'purple', 1000, -1, 200, '{"type": "excellence"}', 1),
    ('Certificado de Mestre', 'Certificado de conclusão de trilha de especialização', 'certificate', 1000, 'legendary', 'black', 3000, -1, 201, '{"type": "master"}', 1),
    
    -- Unlocks (desbloqueios)
    ('Tema Escuro Premium', 'Desbloqueie o tema escuro exclusivo', 'unlock', 200, 'rare', 'orange', 300, -1, 300, '{"type": "theme_dark"}', 1),
    ('Avatar Animado', 'Seu avatar ganha animações especiais', 'unlock', 400, 'epic', 'blue', 800, -1, 301, '{"type": "animated_avatar"}', 1),
    ('Título Personalizado', 'Crie seu próprio título no perfil', 'unlock', 300, 'epic', 'green', 600, -1, 302, '{"type": "custom_title"}', 1)
  `);
  
  console.log('[Seed] Tech Coins items added successfully!');
} catch (error) {
  console.error('[Seed] Error:', error);
} finally {
  await connection.end();
}
