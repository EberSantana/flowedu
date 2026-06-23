import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';

const router = express.Router();

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/plain', // .txt
      'text/csv', // .csv
      'application/csv', // .csv alternative
    ];
    
    // Also allow by extension
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (allowedMimes.includes(file.mimetype) || ['docx', 'xlsx', 'xls', 'csv', 'txt'].includes(ext || '')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use .docx, .xlsx, .csv ou .txt'));
    }
  },
});

interface ParsedStudent {
  registrationNumber: string;
  fullName: string;
}

function parseTextContent(text: string): ParsedStudent[] {
  const students: ParsedStudent[] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    
    // Skip header-like lines
    const lower = trimmed.toLowerCase();
    if (lower.includes('matrícula') || lower.includes('matricula') ||
        lower.includes('nome completo') || lower.includes('registro') ||
        lower.includes('código') || lower.includes('codigo') ||
        lower.includes('turma') || lower.includes('disciplina') ||
        (lower.includes('aluno') && lower.includes('nome'))) continue;
    
    // Skip lines that look like titles/headers (no digits at all or too short)
    if (!/\d/.test(trimmed)) continue;
    
    let regNum = '';
    let name = '';
    
    // Try different separators: tab, semicolon, comma, dash with spaces, multiple spaces
    const separators: (string | RegExp)[] = ['\t', ';', ',', ' - ', /\s{2,}/];
    
    for (const sep of separators) {
      const parts = trimmed.split(sep);
      if (parts.length >= 2) {
        const first = parts[0].trim();
        const rest = parts.slice(1).join(typeof sep === 'string' ? sep : ' ').trim();
        
        if (/^\d+/.test(first) && rest.length > 2 && /[a-zA-ZÀ-ÿ]/.test(rest)) {
          regNum = first.replace(/[^\d\w.-]/g, '');
          name = rest;
          break;
        } else if (/^\d+/.test(rest) && first.length > 2 && /[a-zA-ZÀ-ÿ]/.test(first)) {
          regNum = rest.replace(/[^\d\w.-]/g, '');
          name = first;
          break;
        }
      }
    }
    
    // Fallback: try to extract leading number as registration
    if (!regNum) {
      const match = trimmed.match(/^(\d[\d.\-\/]*\d?)\s+(.+)/);
      if (match) {
        regNum = match[1].trim();
        name = match[2].trim();
      }
    }
    
    if (regNum && name && name.length > 1) {
      // Clean up name - remove extra whitespace and trailing tabs/spaces
      name = name.replace(/\s+/g, ' ').trim();
      // Remove trailing non-alpha characters
      name = name.replace(/[\t\s]+$/, '');
      students.push({ registrationNumber: regNum, fullName: name });
    }
  }
  
  return students;
}

// Endpoint para parsing de lista de alunos
router.post('/parse-student-list', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
        students: [],
      });
    }

    console.log('[Parse Student List] Processing file:', req.file.originalname, 'Type:', req.file.mimetype, 'Size:', req.file.size);

    const ext = req.file.originalname.toLowerCase().split('.').pop();
    let students: ParsedStudent[] = [];

    if (ext === 'docx') {
      // Parse DOCX with mammoth
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      const text = result.value;
      console.log('[Parse Student List] DOCX text extracted, length:', text.length);
      students = parseTextContent(text);
    } else if (ext === 'xlsx' || ext === 'xls') {
      // Parse Excel with xlsx
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

        // Detectar automaticamente quais colunas contêm matrícula e nome
        // Suporta formatos: [Matrícula, Nome], [#, Matrícula, Nome], [Nome, Matrícula], etc.
        let regCol = -1;
        let nameCol = -1;

        // Primeiro, tentar detectar pelo cabeçalho (primeira linha)
        if (data.length > 0) {
          const header = (data[0] as any[]).map((h: any) => String(h || '').toLowerCase().trim());
          for (let i = 0; i < header.length; i++) {
            const h = header[i];
            if (h.includes('matr') || h.includes('ra') || h === 'código' || h === 'codigo' || h === 'registro') {
              regCol = i;
            } else if (h.includes('nome') || h.includes('aluno') || h.includes('estudante')) {
              nameCol = i;
            }
          }
        }

        // Se não detectou pelo cabeçalho, detectar pelos dados
        if (regCol === -1 || nameCol === -1) {
          // Analisar as primeiras linhas de dados para identificar colunas
          const sampleRows = data.slice(1, 6).filter((r: any) => Array.isArray(r) && r.length >= 2);
          if (sampleRows.length > 0) {
            const colCount = Math.max(...sampleRows.map((r: any) => r.length));
            const colScores: { reg: number; name: number }[] = Array.from({ length: colCount }, () => ({ reg: 0, name: 0 }));

            for (const row of sampleRows) {
              for (let i = 0; i < (row as any[]).length; i++) {
                const val = String((row as any[])[i] || '').trim();
                // Matrícula: só dígitos, comprimento >= 5
                if (/^\d{5,}$/.test(val)) colScores[i].reg += 2;
                // Nome: contém letras e espaços, sem dígitos
                if (/^[a-zA-ZÀ-ÿ\s]{5,}$/.test(val)) colScores[i].name += 2;
              }
            }

            let bestReg = -1, bestName = -1, bestRegScore = 0, bestNameScore = 0;
            for (let i = 0; i < colScores.length; i++) {
              if (colScores[i].reg > bestRegScore) { bestRegScore = colScores[i].reg; bestReg = i; }
              if (colScores[i].name > bestNameScore) { bestNameScore = colScores[i].name; bestName = i; }
            }
            if (bestReg !== -1) regCol = bestReg;
            if (bestName !== -1) nameCol = bestName;
          }
        }

        // Fallback: se ainda não detectou, usar col 0 = matrícula, col 1 = nome
        // (ou col 1 = matrícula, col 2 = nome se col 0 parece ser índice numérico)
        if (regCol === -1 || nameCol === -1) {
          const firstDataRow = data.find((r: any) => Array.isArray(r) && r.length >= 2 &&
            !/matr|nome|#/i.test(String(r[0] || '')));
          if (firstDataRow) {
            const c0 = String((firstDataRow as any[])[0] || '').trim();
            const c1 = String((firstDataRow as any[])[1] || '').trim();
            const c2 = (firstDataRow as any[]).length > 2 ? String((firstDataRow as any[])[2] || '').trim() : '';
            // Se col0 é número pequeno (índice) e col1 é matrícula longa
            if (/^\d{1,3}$/.test(c0) && /^\d{5,}$/.test(c1)) {
              regCol = 1; nameCol = 2;
            } else {
              regCol = 0; nameCol = 1;
            }
          } else {
            regCol = 0; nameCol = 1;
          }
        }

        console.log('[Parse Student List] Detected columns: reg=', regCol, 'name=', nameCol);

        // Processar linhas pulando cabeçalho
        const headerKeywords = ['matr', 'nome', 'aluno', 'registro', 'código', 'codigo', '#', 'nº', 'numero'];
        for (const row of data) {
          if (!Array.isArray(row)) continue;
          const regVal = String(row[regCol] || '').trim();
          const nameVal = String(row[nameCol] || '').trim();

          if (!regVal || !nameVal) continue;

          // Pular linhas de cabeçalho
          const lowerReg = regVal.toLowerCase();
          const lowerName = nameVal.toLowerCase();
          if (headerKeywords.some(k => lowerReg.includes(k) || lowerName.includes(k))) continue;

          // Validar: matrícula deve conter dígitos, nome deve conter letras
          if (/\d/.test(regVal) && /[a-zA-ZÀ-ÿ]/.test(nameVal) && nameVal.length > 2) {
            students.push({
              registrationNumber: regVal.replace(/[^\d\w.-]/g, ''),
              fullName: nameVal.replace(/\s+/g, ' ').trim(),
            });
          }
        }
      } catch (xlsxError: any) {
        console.error('[Parse Student List] XLSX error:', xlsxError);
        return res.status(400).json({
          success: false,
          message: 'Erro ao processar planilha Excel. Verifique o formato.',
          students: [],
        });
      }
    } else if (ext === 'csv' || ext === 'txt') {
      // Parse CSV/TXT
      const text = req.file.buffer.toString('utf-8');
      students = parseTextContent(text);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Formato não suportado. Use .docx, .xlsx, .csv ou .txt',
        students: [],
      });
    }

    console.log('[Parse Student List] Found', students.length, 'students');

    return res.json({
      success: true,
      students,
      count: students.length,
      filename: req.file.originalname,
    });
  } catch (error: any) {
    console.error('[Parse Student List] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar arquivo',
      students: [],
    });
  }
});

export default router;
