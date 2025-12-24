import { drizzle } from "drizzle-orm/mysql2";
import { shifts, timeSlots } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seedData() {
  console.log("Seeding initial data...");
  
  // Criar turnos padrão
  const shiftsData = [
    { name: "MATUTINO", color: "#00bfff", displayOrder: 1, userId: 1 },
    { name: "VESPERTINO", color: "#32cd32", displayOrder: 2, userId: 1 },
    { name: "NOTURNO", color: "#ffd700", displayOrder: 3, userId: 1 },
  ];
  
  for (const shift of shiftsData) {
    await db.insert(shifts).values(shift);
  }
  
  console.log("Shifts created!");
  
  // Buscar IDs dos turnos criados
  const allShifts = await db.select().from(shifts);
  const matutino = allShifts.find(s => s.name === "MATUTINO");
  const vespertino = allShifts.find(s => s.name === "VESPERTINO");
  const noturno = allShifts.find(s => s.name === "NOTURNO");
  
  // Criar horários do Matutino
  const matutinoSlots = [
    { shiftId: matutino.id, slotNumber: 1, startTime: "07:15", endTime: "08:05", userId: 1 },
    { shiftId: matutino.id, slotNumber: 2, startTime: "08:05", endTime: "08:55", userId: 1 },
    { shiftId: matutino.id, slotNumber: 3, startTime: "08:55", endTime: "09:45", userId: 1 },
    { shiftId: matutino.id, slotNumber: 4, startTime: "10:00", endTime: "10:50", userId: 1 },
    { shiftId: matutino.id, slotNumber: 5, startTime: "10:50", endTime: "11:40", userId: 1 },
  ];
  
  // Criar horários do Vespertino
  const vespertinoSlots = [
    { shiftId: vespertino.id, slotNumber: 1, startTime: "13:30", endTime: "14:20", userId: 1 },
    { shiftId: vespertino.id, slotNumber: 2, startTime: "14:20", endTime: "15:10", userId: 1 },
    { shiftId: vespertino.id, slotNumber: 3, startTime: "15:10", endTime: "16:00", userId: 1 },
    { shiftId: vespertino.id, slotNumber: 4, startTime: "16:15", endTime: "17:05", userId: 1 },
    { shiftId: vespertino.id, slotNumber: 5, startTime: "17:05", endTime: "17:55", userId: 1 },
  ];
  
  // Criar horários do Noturno
  const noturnoSlots = [
    { shiftId: noturno.id, slotNumber: 1, startTime: "18:30", endTime: "19:30", userId: 1 },
    { shiftId: noturno.id, slotNumber: 2, startTime: "19:30", endTime: "20:30", userId: 1 },
    { shiftId: noturno.id, slotNumber: 3, startTime: "20:30", endTime: "21:30", userId: 1 },
    { shiftId: noturno.id, slotNumber: 4, startTime: "21:30", endTime: "22:30", userId: 1 },
  ];
  
  const allSlots = [...matutinoSlots, ...vespertinoSlots, ...noturnoSlots];
  
  for (const slot of allSlots) {
    await db.insert(timeSlots).values(slot);
  }
  
  console.log("Time slots created!");
  console.log("Seeding completed successfully!");
  process.exit(0);
}

seedData().catch(err => {
  console.error("Error seeding data:", err);
  process.exit(1);
});
