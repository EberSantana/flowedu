import { seedSpecializationSkills } from './server/db.ts';

console.log('Iniciando seed de skills de especialização...');

seedSpecializationSkills()
  .then(() => {
    console.log('✅ Seed concluído com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  });
