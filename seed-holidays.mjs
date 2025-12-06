import { drizzle } from "drizzle-orm/mysql2";
import { calendarEvents } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Datas comemorativas brasileiras (recorrentes anualmente)
const brazilianHolidays = [
  // Feriados Nacionais
  { title: "Confraternização Universal", date: "01-01", type: "holiday" },
  { title: "Carnaval", date: "02-13", type: "holiday" }, // Data varia, exemplo 2024
  { title: "Sexta-feira Santa", date: "03-29", type: "holiday" }, // Data varia
  { title: "Tiradentes", date: "04-21", type: "holiday" },
  { title: "Dia do Trabalho", date: "05-01", type: "holiday" },
  { title: "Corpus Christi", date: "05-30", type: "holiday" }, // Data varia
  { title: "Independência do Brasil", date: "09-07", type: "holiday" },
  { title: "Nossa Senhora Aparecida", date: "10-12", type: "holiday" },
  { title: "Finados", date: "11-02", type: "holiday" },
  { title: "Proclamação da República", date: "11-15", type: "holiday" },
  { title: "Dia da Consciência Negra", date: "11-20", type: "holiday" },
  { title: "Natal", date: "12-25", type: "holiday" },
  
  // Datas Comemorativas Educacionais
  { title: "Dia do Professor", date: "10-15", type: "commemorative", description: "Homenagem aos educadores" },
  { title: "Dia do Estudante", date: "08-11", type: "commemorative" },
  { title: "Dia da Escola", date: "03-15", type: "commemorative" },
  { title: "Dia do Livro Infantil", date: "04-18", type: "commemorative" },
  { title: "Dia da Educação", date: "04-28", type: "commemorative" },
  { title: "Dia Nacional da Alfabetização", date: "11-14", type: "commemorative" },
  
  // Outras Datas Comemorativas
  { title: "Dia Internacional da Mulher", date: "03-08", type: "commemorative" },
  { title: "Dia do Índio", date: "04-19", type: "commemorative" },
  { title: "Dia das Mães", date: "05-12", type: "commemorative" }, // 2º domingo de maio
  { title: "Dia Mundial do Meio Ambiente", date: "06-05", type: "commemorative" },
  { title: "Festa Junina", date: "06-24", type: "commemorative", description: "São João" },
  { title: "Dia dos Pais", date: "08-11", type: "commemorative" }, // 2º domingo de agosto
  { title: "Dia da Árvore", date: "09-21", type: "commemorative" },
  { title: "Dia das Crianças", date: "10-12", type: "commemorative" },
  { title: "Dia da Bandeira", date: "11-19", type: "commemorative" },
];

console.log("Populando datas comemorativas brasileiras...");
console.log("Este script adiciona eventos para o usuário com ID 1");
console.log("Total de eventos:", brazilianHolidays.length);

const currentYear = new Date().getFullYear();

for (const holiday of brazilianHolidays) {
  const eventDate = `${currentYear}-${holiday.date}`;
  const color = holiday.type === "holiday" ? "#ef4444" : "#f59e0b";
  
  await db.insert(calendarEvents).values({
    userId: 1, // ID do primeiro usuário
    title: holiday.title,
    description: holiday.description || null,
    eventDate: eventDate,
    eventType: holiday.type,
    isRecurring: 1, // Recorrente anualmente
    color: color,
  });
  
  console.log(`✓ ${holiday.title} - ${eventDate}`);
}

console.log("\nDatas comemorativas adicionadas com sucesso!");
process.exit(0);
