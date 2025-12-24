import { cleanInvalidUsers } from './server/db.ts';

console.log('Limpando usuários inválidos...');
const result = await cleanInvalidUsers();
console.log(result);
process.exit(0);
