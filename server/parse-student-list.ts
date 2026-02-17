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
        
        for (const row of data) {
          if (!Array.isArray(row) || row.length < 2) continue;
          
          const firstCol = String(row[0] || '').trim();
          const secondCol = String(row[1] || '').trim();
          
          if (!firstCol || !secondCol) continue;
          
          const lowerFirst = firstCol.toLowerCase();
          if (lowerFirst.includes('matrícula') || lowerFirst.includes('matricula') || 
              lowerFirst.includes('registro') || lowerFirst === 'ra' ||
              lowerFirst === 'nº' || lowerFirst === 'numero') continue;
          
          if (/\d/.test(firstCol) && /[a-zA-ZÀ-ÿ]/.test(secondCol)) {
            students.push({
              registrationNumber: firstCol,
              fullName: secondCol,
            });
          } else if (/\d/.test(secondCol) && /[a-zA-ZÀ-ÿ]/.test(firstCol)) {
            students.push({
              registrationNumber: secondCol,
              fullName: firstCol,
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
