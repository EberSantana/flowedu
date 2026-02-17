/**
 * Parser determinístico para calendários acadêmicos brasileiros (IFAM)
 * 
 * ABORDAGEM:
 * O PDF tem layout de 2 colunas por seção de mês:
 * - Coluna esquerda (X < 450): grid do calendário (D S T Q Q S S + números) + nome do mês
 * - Coluna direita (X >= 450): lista de eventos com datas
 * 
 * Cada página tem 3 seções de meses empilhadas verticalmente.
 * Os meses aparecem na coluna esquerda, e os eventos na coluna direita.
 * 
 * SOLUÇÃO: Extrair texto com informação de posição (X, Y) e:
 * 1. Identificar cabeçalhos de meses pela posição X < 200 e nome do mês
 * 2. Associar eventos (X >= 450) ao mês correto baseado na posição Y
 * 
 * Este parser aceita DOIS formatos de entrada:
 * A) Texto estruturado com marcadores === PAGINA === (formato antigo, fallback)
 * B) Texto estruturado com marcadores [MONTH:N] (formato novo, preferido)
 */

const MONTH_MAP: Record<string, number> = {
  'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'março': 3,
  'abril': 4, 'maio': 5, 'junho': 6,
  'julho': 7, 'agosto': 8, 'setembro': 9,
  'outubro': 10, 'novembro': 11, 'dezembro': 12,
};

export const FERIADOS_NACIONAIS_FIXOS: Record<string, string> = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalhador',
  '09-07': 'Independência do Brasil',
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Dia de Zumbi dos Palmares e da Consciência Negra',
  '12-25': 'Natal',
};

const FERIADOS_ESTADUAIS_AM: Record<string, string> = {
  '09-05': 'Elevação do Amazonas à Categoria de Província',
  '12-08': 'N. S. da Imaculada Conceição',
};

const FERIADOS_MUNICIPAIS_COARI: Record<string, string> = {
  '08-02': 'Aniversário da Cidade de Coari',
};

function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, month - 1, day);
}

function calcularFeriadosMoveis(ano: number): Record<string, string> {
  const pascoa = calcularPascoa(ano);
  const feriadosMoveis: Record<string, string> = {};
  
  const carnavalTerca = new Date(pascoa);
  carnavalTerca.setDate(pascoa.getDate() - 47);
  const carnavalSegunda = new Date(carnavalTerca);
  carnavalSegunda.setDate(carnavalTerca.getDate() - 1);
  const quartaCinzas = new Date(carnavalTerca);
  quartaCinzas.setDate(carnavalTerca.getDate() + 1);
  
  feriadosMoveis[formatMonthDay(carnavalSegunda)] = 'Carnaval (Segunda)';
  feriadosMoveis[formatMonthDay(carnavalTerca)] = 'Carnaval';
  feriadosMoveis[formatMonthDay(quartaCinzas)] = 'Quarta-feira de Cinzas';
  
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);
  feriadosMoveis[formatMonthDay(sextaSanta)] = 'Sexta-feira Santa';
  
  feriadosMoveis[formatMonthDay(pascoa)] = 'Páscoa';
  
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);
  feriadosMoveis[formatMonthDay(corpusChristi)] = 'Corpus Christi';
  
  return feriadosMoveis;
}

function formatMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface ParsedEvent {
  title: string;
  description: string;
  eventDate: string;
  eventType: 'holiday' | 'commemorative' | 'school_event' | 'personal';
}

const HOLIDAY_KEYWORDS = [
  'feriado', 'ponto facultativo', 'recesso',
];

const COMMEMORATIVE_KEYWORDS = [
  'dia internacional', 'dia mundial', 'dia nacional', 'dia das mães',
  'dia dos pais', 'dia do estudante', 'dia do professor', 'dia do servidor',
  'semana nacional', 'semana da consciência', 'dia de combate',
  'dia da mulher', 'dia da ciência', 'dia da propriedade',
  'dia de conscientização', 'dia da língua', 'dia da luta',
  'dia do trabalhador', 'dia da saúde',
];

function classificarEvento(titulo: string, descricao: string, monthDay: string, feriadosFixos: Set<string>): 'holiday' | 'commemorative' | 'school_event' {
  const textoLower = (titulo + ' ' + descricao).toLowerCase();
  
  if (feriadosFixos.has(monthDay)) return 'holiday';
  
  for (const kw of HOLIDAY_KEYWORDS) {
    if (textoLower.includes(kw)) return 'holiday';
  }
  
  if (textoLower.includes('carnaval') || textoLower.includes('corpus christi') ||
      textoLower.includes('sexta-feira santa') || textoLower.includes('sexta - feira santa') ||
      textoLower.includes('páscoa') || textoLower.includes('pascoa') ||
      textoLower.includes('tiradentes') || textoLower.includes('natal.') ||
      textoLower.includes('finados') || textoLower.includes('proclamação') ||
      textoLower.includes('independência') || textoLower.includes('aparecida') ||
      textoLower.includes('confraternização') || textoLower.includes('zumbi') ||
      textoLower.includes('consciência negra') || textoLower.includes('imaculada conceição') ||
      textoLower.includes('aniversário da cidade') || textoLower.includes('véspera de natal')) {
    return 'holiday';
  }
  
  for (const kw of COMMEMORATIVE_KEYWORDS) {
    if (textoLower.includes(kw)) return 'commemorative';
  }
  
  return 'school_event';
}

/**
 * Tenta extrair um evento de uma linha de texto.
 * Retorna {day, month?, title} ou null.
 */
function tryParseEventLine(line: string): { day: number; month?: number; title: string } | null {
  let text = line.trim();
  if (!text) return null;
  
  // Ignorar linhas que são claramente não-eventos
  if (/^D\s+S\s+T\s+Q\s+Q\s+S\s+S$/i.test(text)) return null;
  if (/^(\d{1,2}\s+)+\d{1,2}$/.test(text)) return null;
  if (/^\d{1,2}$/.test(text)) return null;
  if (/^Dias?\s*Letivos?/i.test(text)) return null;
  if (/^Total\s/i.test(text)) return null;
  if (/^CALEND[AÁ]RIO/i.test(text)) return null;
  if (/^GRADUA[CÇ][AÃ]O/i.test(text)) return null;
  if (/^SIST[EÊ]MICO/i.test(text)) return null;
  if (/^Vers[aã]o/i.test(text)) return null;
  
  // Padrão: "DD/MM a DD/MM - Evento"
  let m = text.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:a|e)\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*[-–]\s*(.+)/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]), title: m[5].trim() };
  
  // Padrão: "DD a DD/MM - Evento"
  m = text.match(/^(\d{1,2})\s*(?:a|e)\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*[-–]\s*(.+)/);
  if (m) return { day: parseInt(m[1]), title: m[4].trim() };
  
  // Padrão: "DD a DD - Evento" ou "DD e DD - Evento"
  m = text.match(/^(\d{1,2})\s*(?:a|e)\s*(\d{1,2})\s*[-–]\s*(.+)/);
  if (m && m[3].trim().length >= 3) return { day: parseInt(m[1]), title: m[3].trim() };
  
  // Padrão: "DD/MM - Evento"
  m = text.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*[-–]\s*(.+)/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]), title: m[3].trim() };
  
  // Padrão: "DD - Evento" ou "DD – Evento"
  m = text.match(/^(\d{1,2})\s*[-–]\s*(.+)/);
  if (m && m[2].trim().length >= 3 && !/^\d{1,2}:\d{2}/.test(text)) {
    return { day: parseInt(m[1]), title: m[2].trim() };
  }
  
  return null;
}

/**
 * Extrai texto do PDF com informação de posição para separar colunas.
 * Retorna texto estruturado com marcadores [MONTH:N] antes de cada bloco de eventos.
 */
export function extractStructuredText(pages: Array<{items: Array<{str: string; transform: number[]}>}>): string {
  const monthRegex = /^(JANEIRO|FEVEREIRO|MAR[CÇ]O|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)$/i;
  
  let result = '';
  
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const items = pages[pageIdx].items;
    if (!items || items.length === 0) continue;
    
    // Agrupar itens por posição Y (linha)
    const lineGroups: Map<number, Array<{text: string; x: number; y: number}>> = new Map();
    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!lineGroups.has(y)) lineGroups.set(y, []);
      lineGroups.get(y)!.push({ text: item.str, x, y });
    }
    
    // Ordenar linhas por Y descendente (PDF: bottom=0, top=max)
    const sortedYs = Array.from(lineGroups.keys()).sort((a, b) => b - a);
    
    // Identificar seções de meses nesta página
    // Cada seção de mês tem: cabeçalho do mês (X < 200) e eventos (X >= 450)
    interface MonthBlock {
      month: number;
      monthY: number;
      eventLines: Array<{y: number; text: string}>;
    }
    
    const monthBlocks: MonthBlock[] = [];
    
    // Primeiro: encontrar todos os cabeçalhos de meses
    for (const y of sortedYs) {
      const lineItems = lineGroups.get(y)!.sort((a, b) => a.x - b.x);
      for (const item of lineItems) {
        if (item.x < 200) {
          const match = item.text.trim().match(monthRegex);
          if (match) {
            const monthName = match[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const mapped = monthName === 'marco' ? 3 : (MONTH_MAP[monthName] || 0);
            if (mapped > 0) {
              monthBlocks.push({ month: mapped, monthY: y, eventLines: [] });
            }
          }
        }
      }
    }
    
    // Ordenar blocos de meses por Y descendente (primeiro mês no topo da página)
    monthBlocks.sort((a, b) => b.monthY - a.monthY);
    
    // Agora: para cada linha, extrair texto da coluna direita (eventos) 
    // e associar ao mês correto baseado na posição Y
    for (const y of sortedYs) {
      const lineItems = lineGroups.get(y)!.sort((a, b) => a.x - b.x);
      
      // Extrair texto da coluna direita (X >= 450)
      const rightColumnItems = lineItems.filter(item => item.x >= 450);
      if (rightColumnItems.length === 0) continue;
      
      const eventText = rightColumnItems.map(item => item.text).join(' ').trim();
      if (!eventText) continue;
      
      // Encontrar o mês correto para esta linha baseado na posição Y
      // IMPORTANTE: No PDF, cada página tem 3 seções de meses empilhadas.
      // Os cabeçalhos de meses estão em Y altos e os eventos abaixo deles.
      // Porém, alguns eventos do mês seguinte aparecem ACIMA do cabeçalho
      // do mês seguinte (ex: Y=963 para evento de Maio, mas header Maio Y=956).
      // Usamos margem de tolerância de 50px para resolver isso.
      const Y_TOLERANCE = 50;
      
      let bestBlock: MonthBlock | null = null;
      for (const block of monthBlocks) {
        // O cabeçalho do mês está acima (Y >= lineY) ou próximo (com tolerância)
        if (block.monthY >= y - Y_TOLERANCE) {
          if (!bestBlock || block.monthY < bestBlock.monthY) {
            bestBlock = block;
          }
        }
      }
      
      // Se não encontrou mês acima (com tolerância), pode ser um evento órfão
      if (!bestBlock && monthBlocks.length > 0) {
        // Atribuir ao mês com Y mais próximo abaixo
        for (const block of monthBlocks) {
          if (block.monthY < y) {
            if (!bestBlock || block.monthY > bestBlock.monthY) {
              bestBlock = block;
            }
          }
        }
      }      
      if (bestBlock) {
        bestBlock.eventLines.push({ y, text: eventText });
      }
    }
    
    // Gerar texto estruturado
    // Ordenar blocos por mês numérico para output consistente
    monthBlocks.sort((a, b) => a.month - b.month);
    
    for (const block of monthBlocks) {
      result += `\n[MONTH:${block.month}]\n`;
      // Ordenar linhas de eventos por Y descendente (topo para baixo)
      block.eventLines.sort((a, b) => b.y - a.y);
      for (const line of block.eventLines) {
        result += line.text + '\n';
      }
    }
  }
  
  return result;
}

/**
 * Parser principal - aceita texto estruturado com marcadores [MONTH:N]
 */
export function parseCalendarText(pdfText: string, year: number): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const seenDates = new Map<string, Set<string>>();
  
  const feriadosMoveis = calcularFeriadosMoveis(year);
  const todosOsFeriados = new Set<string>([
    ...Object.keys(FERIADOS_NACIONAIS_FIXOS),
    ...Object.keys(FERIADOS_ESTADUAIS_AM),
    ...Object.keys(FERIADOS_MUNICIPAIS_COARI),
    ...Object.keys(feriadosMoveis),
  ]);
  
  function addEvent(day: number, month: number, title: string) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return;
    
    const dateStr = formatDate(year, month, day);
    const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let cleanTitle = title.trim().replace(/\s+/g, ' ').replace(/^[-–:]\s*/, '').replace(/\s*[-–:]\s*$/, '');
    
    // Filtrar títulos inválidos
    if (!cleanTitle || cleanTitle.length < 3) return;
    if (/^dias?\s*letivos?/i.test(cleanTitle)) return;
    if (/^total\s/i.test(cleanTitle)) return;
    if (/^\d+\s*dias?\s*letivos?/i.test(cleanTitle)) return;
    if (/^calend[aá]rio/i.test(cleanTitle)) return;
    if (/^gradua[cç][aã]o/i.test(cleanTitle)) return;
    if (/^Remanescentes\.?$/i.test(cleanTitle)) return;
    if (/^vagas\s/i.test(cleanTitle)) return;
    if (/^Adolescentes\.?$/i.test(cleanTitle)) return;
    if (/^M[uú]ltipla\.?$/i.test(cleanTitle)) return;
    if (/^ERBI$/i.test(cleanTitle)) return;
    if (/^Conhecimento/i.test(cleanTitle)) return;
    if (/^\(PNAES\)/i.test(cleanTitle)) return;
    if (/^EJA\s+EPT/i.test(cleanTitle)) return;
    if (/^dos\s+cursos/i.test(cleanTitle)) return;
    if (/^SIGAA/i.test(cleanTitle)) return;
    if (/^Permanência/i.test(cleanTitle)) return;
    if (/^Convocação/i.test(cleanTitle)) return;
    if (/^disponibilização/i.test(cleanTitle)) return;
    if (/^Reabertura/i.test(cleanTitle)) return;
    
    // Deduplicação
    if (!seenDates.has(dateStr)) seenDates.set(dateStr, new Set());
    const titleNorm = cleanTitle.toLowerCase().substring(0, 50);
    if (seenDates.get(dateStr)!.has(titleNorm)) return;
    seenDates.get(dateStr)!.add(titleNorm);
    
    const eventType = classificarEvento(cleanTitle, '', monthDay, todosOsFeriados);
    events.push({ title: cleanTitle, description: cleanTitle, eventDate: dateStr, eventType });
  }
  
  // Verificar se o texto tem marcadores [MONTH:N] (formato novo)
  if (pdfText.includes('[MONTH:')) {
    // Formato novo: texto estruturado com marcadores de mês
    const lines = pdfText.split('\n');
    let currentMonth = 0;
    
    for (const line of lines) {
      const monthMarker = line.match(/^\[MONTH:(\d+)\]$/);
      if (monthMarker) {
        currentMonth = parseInt(monthMarker[1]);
        continue;
      }
      
      if (currentMonth === 0) continue;
      
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Tentar extrair evento
      const parsed = tryParseEventLine(trimmed);
      if (parsed) {
        const month = parsed.month || currentMonth;
        addEvent(parsed.day, month, parsed.title);
      }
    }
  } else {
    // Formato antigo: texto com marcadores === PAGINA ===
    // Fallback: tentar extrair com abordagem de cabeçalhos de mês
    const lines = pdfText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const monthRegex = /\b(JANEIRO|FEVEREIRO|MAR[CÇ]O|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\b/i;
    
    let currentMonth = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detectar cabeçalho de mês
      const monthMatch = trimmed.match(monthRegex);
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const mapped = monthName === 'marco' ? 3 : (MONTH_MAP[monthName] || 0);
        if (mapped > 0) {
          // Verificar se é cabeçalho (não parte de texto longo)
          const withoutMonth = trimmed.replace(monthRegex, '').trim();
          if (withoutMonth.length < 30 || trimmed.toUpperCase().startsWith(monthMatch[1].toUpperCase())) {
            currentMonth = mapped;
            // Se tem evento na mesma linha, extrair
            if (withoutMonth.length >= 10) {
              const parsed = tryParseEventLine(withoutMonth);
              if (parsed) {
                addEvent(parsed.day, parsed.month || currentMonth, parsed.title);
              }
            }
            continue;
          }
        }
      }
      
      if (currentMonth === 0) continue;
      
      // Tentar extrair evento
      const parsed = tryParseEventLine(trimmed);
      if (parsed) {
        const month = parsed.month || currentMonth;
        addEvent(parsed.day, month, parsed.title);
      }
    }
  }
  
  // === GARANTIR FERIADOS ===
  // Feriados nacionais fixos
  for (const [monthDay, name] of Object.entries(FERIADOS_NACIONAIS_FIXOS)) {
    const dateStr = `${year}-${monthDay}`;
    if (!seenDates.has(dateStr)) {
      events.push({ title: name, description: `Feriado Nacional - ${name}`, eventDate: dateStr, eventType: 'holiday' });
    }
  }
  
  // Feriados móveis
  for (const [monthDay, name] of Object.entries(feriadosMoveis)) {
    const dateStr = `${year}-${monthDay}`;
    if (!seenDates.has(dateStr)) {
      events.push({ title: name, description: `Feriado Móvel - ${name}`, eventDate: dateStr, eventType: 'holiday' });
    }
  }
  
  // Feriados estaduais
  for (const [monthDay, name] of Object.entries(FERIADOS_ESTADUAIS_AM)) {
    const dateStr = `${year}-${monthDay}`;
    if (!seenDates.has(dateStr)) {
      events.push({ title: name, description: `Feriado Estadual - ${name}`, eventDate: dateStr, eventType: 'holiday' });
    }
  }
  
  // Feriados municipais
  for (const [monthDay, name] of Object.entries(FERIADOS_MUNICIPAIS_COARI)) {
    const dateStr = `${year}-${monthDay}`;
    if (!seenDates.has(dateStr)) {
      events.push({ title: name, description: `Feriado Municipal - ${name}`, eventDate: dateStr, eventType: 'holiday' });
    }
  }
  
  events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  return events;
}

/**
 * Detecta o ano do calendário acadêmico a partir do texto extraído do PDF.
 */
export function detectCalendarYear(pdfText: string): number {
  // Procurar "Calendário Acadêmico" seguido de ano completo
  let match = pdfText.match(/CALEND[AÁ]RIO\s+ACAD[EÊ]MICO\s+(20\d{2})/i);
  if (match) return parseInt(match[1]);
  
  // "CALENDÁRIO ACADÊMICO 20" + "26" separado por espaços ou quebra de linha
  match = pdfText.match(/CALEND[AÁ]RIO\s+ACAD[EÊ]MICO\s+20\s+(\d{2})\b/i);
  if (match) return parseInt(`20${match[1]}`);
  
  // "CALENDÁRIO ACADÊMICO 20" + "26" na próxima(s) linha(s)
  match = pdfText.match(/CALEND[AÁ]RIO\s+ACAD[EÊ]MICO\s+20\s*\n(?:.*\n){0,3}\s*(\d{2})\b/i);
  if (match) return parseInt(`20${match[1]}`);
  
  // Procurar "20XX" isolado perto de "CALENDÁRIO"
  match = pdfText.match(/CALEND[AÁ]RIO[\s\S]{0,50}(20\d{2})/i);
  if (match) return parseInt(match[1]);
  
  // Contar frequência de anos 20XX no texto
  const yearCounts: Record<number, number> = {};
  const yearRegex = /\b(20\d{2})\b/g;
  let yearMatch;
  while ((yearMatch = yearRegex.exec(pdfText)) !== null) {
    const y = parseInt(yearMatch[1]);
    if (y >= 2024 && y <= 2030) {
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
  }
  
  let maxCount = 0;
  let bestYear = new Date().getFullYear();
  for (const [y, count] of Object.entries(yearCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestYear = parseInt(y);
    }
  }
  
  return bestYear;
}
