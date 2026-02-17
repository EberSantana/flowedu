// Teste do parser de calendário com o PDF real
const fs = require('fs');
const { parseCalendarText, detectCalendarYear, FERIADOS_NACIONAIS_FIXOS } = require('/tmp/cal-test/calendar-parser.js');

async function testParser() {
  // Importar pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  // Ler o PDF
  const pdfPath = '/home/ubuntu/upload/Calendrio_Acadmico_2026_-_Graduao_Coari_Verso_03_12_2025_1(1).pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  
  // Extrair texto do PDF
  const uint8Array = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;
  
  let pdfText = '';
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    const sortedItems = items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });
    let lastY = -1;
    let pageText = '';
    for (const item of sortedItems) {
      const y = Math.round(item.transform[5]);
      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        pageText += '\n';
      } else if (lastY !== -1) {
        pageText += ' ';
      }
      pageText += item.str;
      lastY = y;
    }
    pdfText += '\n=== PAGINA ' + pageNum + ' ===\n' + pageText + '\n';
  }
  
  // Salvar texto extraído para análise
  fs.writeFileSync('/tmp/pdf_text_extracted.txt', pdfText);
  console.log('Texto extraído salvo em /tmp/pdf_text_extracted.txt');
  console.log('Tamanho:', pdfText.length, 'caracteres');
  
  // Detectar ano
  const year = detectCalendarYear(pdfText);
  console.log('Ano detectado:', year);
  
  // Extrair eventos
  const events = parseCalendarText(pdfText, year);
  console.log('\n=== EVENTOS EXTRAÍDOS ===');
  console.log('Total:', events.length, 'eventos');
  
  // Agrupar por tipo
  const byType = {};
  for (const e of events) {
    if (!byType[e.eventType]) byType[e.eventType] = [];
    byType[e.eventType].push(e);
  }
  
  console.log('\nPor tipo:');
  for (const [type, evts] of Object.entries(byType)) {
    console.log(`  ${type}: ${evts.length}`);
  }
  
  // Verificar feriados nacionais
  console.log('\n=== VERIFICAÇÃO DE FERIADOS NACIONAIS ===');
  const feriadosEsperados = {
    '2026-01-01': 'Confraternização Universal',
    '2026-04-21': 'Tiradentes',
    '2026-05-01': 'Dia do Trabalhador',
    '2026-09-07': 'Independência do Brasil',
    '2026-10-12': 'Nossa Senhora Aparecida',
    '2026-11-02': 'Finados',
    '2026-11-15': 'Proclamação da República',
    '2026-11-20': 'Consciência Negra',
    '2026-12-25': 'Natal',
  };
  
  for (const [date, name] of Object.entries(feriadosEsperados)) {
    const found = events.find(e => e.eventDate === date);
    if (found) {
      console.log(`  ✅ ${date}: ${found.title}`);
    } else {
      console.log(`  ❌ ${date}: ${name} - NÃO ENCONTRADO`);
    }
  }
  
  // Listar todos os eventos por mês
  console.log('\n=== TODOS OS EVENTOS POR MÊS ===');
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  for (let m = 1; m <= 12; m++) {
    const mesStr = m.toString().padStart(2, '0');
    const mesEvents = events.filter(e => e.eventDate.substring(5, 7) === mesStr);
    if (mesEvents.length > 0) {
      console.log(`\n--- ${meses[m-1]} (${mesEvents.length} eventos) ---`);
      for (const e of mesEvents) {
        console.log(`  ${e.eventDate}: [${e.eventType}] ${e.title}`);
      }
    }
  }
}

testParser().catch(console.error);
