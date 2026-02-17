/**
 * Gerador de arquivos ICS (iCalendar) para exportação de eventos
 */

interface CalendarEventICS {
  id?: number;
  title: string;
  description?: string | null;
  eventDate: string; // YYYY-MM-DD
  eventType: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  holiday: "Feriado",
  commemorative: "Data Comemorativa",
  school_event: "Evento Escolar",
  personal: "Observacao Pessoal",
  schedule: "Aula",
};

const EVENT_TYPE_EMOJI: Record<string, string> = {
  holiday: "[Feriado]",
  commemorative: "[Comemorativo]",
  school_event: "[Escolar]",
  personal: "[Pessoal]",
  schedule: "[Aula]",
};

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/**
 * Calcula o dia seguinte a partir de uma string YYYY-MM-DD
 * SEM usar new Date() para evitar problemas de timezone
 */
function getNextDayStr(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  let year = parseInt(yearStr);
  let month = parseInt(monthStr);
  let day = parseInt(dayStr);
  
  // Dias por mês (considerando ano bissexto)
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  day++;
  if (day > daysInMonth[month - 1]) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

function generateUID(prefix: string, id: string | number): string {
  return `flowedu-${prefix}-${id}@flowedu.app`;
}

function getNowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateICSContent(
  events: CalendarEventICS[],
  year: number,
  calendarName?: string
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlowEdu//Calendario Escolar//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName || `FlowEdu - Calendario ${year}`}`,
    "X-WR-TIMEZONE:America/Manaus",
  ];

  const nowStamp = getNowStamp();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const dateStr = formatICSDate(event.eventDate);
    const uid = event.id
      ? generateUID(event.eventType, event.id)
      : generateUID("ev", `${dateStr}-${i}`);

    const prefix = EVENT_TYPE_EMOJI[event.eventType] || "";
    const summary = prefix ? `${prefix} ${event.title}` : event.title;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);

    // Se tem horário de início/fim, usar DTSTART/DTEND com hora
    if (event.startTime && event.endTime) {
      const startDT = `${dateStr}T${event.startTime.replace(":", "")}00`;
      const endDT = `${dateStr}T${event.endTime.replace(":", "")}00`;
      lines.push(`DTSTART;TZID=America/Manaus:${startDT}`);
      lines.push(`DTEND;TZID=America/Manaus:${endDT}`);
    } else {
      // Evento de dia inteiro - usar cálculo de string para evitar timezone
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      const nextDayStr = getNextDayStr(event.eventDate);
      lines.push(`DTEND;VALUE=DATE:${nextDayStr}`);
    }

    lines.push(`SUMMARY:${escapeICSText(summary)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }

    const category = EVENT_TYPE_LABELS[event.eventType] || event.eventType;
    lines.push(`CATEGORIES:${escapeICSText(category)}`);
    lines.push("STATUS:CONFIRMED");
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

export function generateGoogleCalendarURL(event: CalendarEventICS): string {
  const dateStr = formatICSDate(event.eventDate);

  let dates: string;
  if (event.startTime && event.endTime) {
    const start = `${dateStr}T${event.startTime.replace(":", "")}00`;
    const end = `${dateStr}T${event.endTime.replace(":", "")}00`;
    dates = `${start}/${end}`;
  } else {
    // Evento de dia inteiro - usar cálculo de string para evitar timezone
    const nextDayStr = getNextDayStr(event.eventDate);
    dates = `${dateStr}/${nextDayStr}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description || "",
    ctz: "America/Manaus",
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
