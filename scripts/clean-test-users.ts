import * as db from '../server/db';

/**
 * Script para limpar usuários de teste do banco de dados
 * Execute com: pnpm tsx scripts/clean-test-users.ts
 */
async function cleanTestUsers() {
  console.log('🧹 Iniciando limpeza de usuários de teste...\n');
  
  try {
    const allUsers = await db.getAllUsers();
    
    // Filtrar apenas usuários de teste (email contém @test.com)
    const testUsers = allUsers.filter(u => 
      u.email?.includes('@test.com') &&
      !u.email.includes('eberss@gmail.com') // Proteger usuário real
    );
    
    console.log(`📊 Encontrados ${testUsers.length} usuários de teste:\n`);
    
    testUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`);
    });
    
    if (testUsers.length === 0) {
      console.log('\n✅ Nenhum usuário de teste encontrado!');
      return;
    }
    
    console.log(`\n🗑️  Removendo ${testUsers.length} usuários de teste...`);
    
    let deleted = 0;
    let failed = 0;
    
    for (const user of testUsers) {
      try {
        await db.permanentDeleteUser(user.id);
        deleted++;
        console.log(`  ✓ Removido: ${user.name} (${user.email})`);
      } catch (error) {
        failed++;
        console.error(`  ✗ Erro ao remover ${user.name}:`, error);
      }
    }
    
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`   - Removidos: ${deleted}`);
    console.log(`   - Falhas: ${failed}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  }
}

cleanTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
