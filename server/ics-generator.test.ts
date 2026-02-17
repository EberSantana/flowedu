import { describe, it, expect } from "vitest";
import { generateICSContent, generateGoogleCalendarURL } from "./ics-generator";

describe("ICS Generator", () => {
  describe("generateICSContent", () => {
    it("should generate valid ICS content with calendar events", () => {
      const events = [
        {
          id: 1,
          title: "Carnaval",
          description: "Feriado de Carnaval",
          eventDate: "2026-02-16",
          eventType: "holiday",
        },
        {
          id: 2,
          title: "Dia do Professor",
          description: "Data comemorativa",
          eventDate: "2026-10-15",
          eventType: "commemorative",
        },
      ];

      const ics = generateICSContent(events, 2026);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//FlowEdu//Calendario Escolar//PT-BR");
      expect(ics).toContain("X-WR-CALNAME:FlowEdu - Calendario 2026");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("SUMMARY:[Feriado] Carnaval");
      expect(ics).toContain("SUMMARY:[Comemorativo] Dia do Professor");
      expect(ics).toContain("DTSTART;VALUE=DATE:20260216");
      expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
      expect(ics).toContain("DESCRIPTION:Feriado de Carnaval");
      expect(ics).toContain("UID:flowedu-holiday-1@flowedu.app");
      expect(ics).toContain("UID:flowedu-commemorative-2@flowedu.app");
    });

    it("should generate events with time for schedule events", () => {
      const events = [
        {
          title: "Matemática - Turma 1A",
          description: "Aula de Matemática",
          eventDate: "2026-03-02",
          eventType: "schedule",
          startTime: "07:00",
          endTime: "08:00",
        },
      ];

      const ics = generateICSContent(events, 2026);

      expect(ics).toContain("DTSTART;TZID=America/Manaus:20260302T070000");
      expect(ics).toContain("DTEND;TZID=America/Manaus:20260302T080000");
      expect(ics).toContain("SUMMARY:[Aula] Matem\u00e1tica - Turma 1A");
    });

    it("should handle all-day events with correct DTEND (next day)", () => {
      const events = [
        {
          id: 10,
          title: "Feriado Nacional",
          eventDate: "2026-09-07",
          eventType: "holiday",
        },
      ];

      const ics = generateICSContent(events, 2026);

      expect(ics).toContain("DTSTART;VALUE=DATE:20260907");
      expect(ics).toContain("DTEND;VALUE=DATE:20260908");
    });

    it("should generate empty calendar with no events", () => {
      const ics = generateICSContent([], 2026);

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("END:VCALENDAR");
      expect(ics).not.toContain("BEGIN:VEVENT");
    });

    it("should escape special characters in text", () => {
      const events = [
        {
          id: 1,
          title: "Reunião; Pedagógica, 2026",
          description: "Descrição com\nquebra de linha",
          eventDate: "2026-05-10",
          eventType: "school_event",
        },
      ];

      const ics = generateICSContent(events, 2026);

      expect(ics).toContain("Reuni\u00e3o\\; Pedag\u00f3gica\\, 2026");
      expect(ics).toContain("Descri\u00e7\u00e3o com\\nquebra de linha");
    });

    it("should use custom calendar name", () => {
      const ics = generateICSContent([], 2026, "Meu Calendário Especial");

      expect(ics).toContain("X-WR-CALNAME:Meu Calend\u00e1rio Especial");
    });
  });

  describe("generateGoogleCalendarURL", () => {
    it("should generate valid Google Calendar URL for all-day event", () => {
      const event = {
        title: "Feriado",
        description: "Dia de feriado",
        eventDate: "2026-12-25",
        eventType: "holiday",
      };

      const url = generateGoogleCalendarURL(event);

      expect(url).toContain("https://www.google.com/calendar/render");
      expect(url).toContain("action=TEMPLATE");
      expect(url).toContain("text=Feriado");
      expect(url).toContain("20261225");
      expect(url).toContain("20261226");
      expect(url).toContain("ctz=America%2FManaus");
    });

    it("should generate valid Google Calendar URL for timed event", () => {
      const event = {
        title: "Aula de Física",
        description: "Turma 2B",
        eventDate: "2026-03-10",
        eventType: "schedule",
        startTime: "09:00",
        endTime: "10:30",
      };

      const url = generateGoogleCalendarURL(event);

      expect(url).toContain("20260310T090000");
      expect(url).toContain("20260310T103000");
    });
  });
});
