import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedStudent {
  registrationNumber: string;
  fullName: string;
}

export interface ParseResult {
  success: boolean;
  students: ParsedStudent[];
  errors: string[];
}

/**
 * Parse Excel file (.xlsx)
 * Expects columns: Matrícula | Nome Completo
 */
export async function parseExcelFile(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const students: ParsedStudent[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return {
        success: false,
        students: [],
        errors: ['Planilha vazia ou inválida'],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length < 2) {
        continue; // Skip empty rows
      }

      const registrationNumber = String(row[0] || '').trim();
      const fullName = String(row[1] || '').trim();

      if (!registrationNumber || !fullName) {
        errors.push(`Linha ${i + 1}: Matrícula ou nome vazio`);
        continue;
      }

      students.push({
        registrationNumber,
        fullName,
      });
    }

    return {
      success: students.length > 0,
      students,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      students: [],
      errors: [`Erro ao processar Excel: ${error.message}`],
    };
  }
}

/**
 * Parse PDF file
 * Tries to extract registration number and name from text
 */
export async function parsePDFFile(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const students: ParsedStudent[] = [];

  try {
    const data = await (pdfParse as any)(buffer);
    const text = data.text;

    // Try to find patterns like:
    // 2024001 - João Silva
    // 2024001 João Silva
    // Matrícula: 2024001 Nome: João Silva
    const patterns = [
      /(\d+)\s*[-–]\s*([A-Za-zÀ-ÿ\s]+)/g,
      /(\d+)\s+([A-Za-zÀ-ÿ\s]+)/g,
      /Matr[íi]cula:\s*(\d+)\s+Nome:\s*([A-Za-zÀ-ÿ\s]+)/gi,
    ];

    let found = false;
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const m = match as RegExpMatchArray;
        const registrationNumber = m[1].trim();
        const fullName = m[2].trim();

        if (registrationNumber && fullName && fullName.split(' ').length >= 2) {
          students.push({
            registrationNumber,
            fullName,
          });
          found = true;
        }
      }

      if (found) break;
    }

    if (!found) {
      errors.push('Não foi possível identificar matrículas e nomes no PDF. Use o formato: "Matrícula - Nome Completo"');
    }

    return {
      success: students.length > 0,
      students,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      students: [],
      errors: [`Erro ao processar PDF: ${error.message}`],
    };
  }
}

/**
 * Parse DOCX file
 * Tries to extract registration number and name from text
 */
export async function parseDOCXFile(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const students: ParsedStudent[] = [];

  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Same patterns as PDF
    const patterns = [
      /(\d+)\s*[-–]\s*([A-Za-zÀ-ÿ\s]+)/g,
      /(\d+)\s+([A-Za-zÀ-ÿ\s]+)/g,
      /Matr[íi]cula:\s*(\d+)\s+Nome:\s*([A-Za-zÀ-ÿ\s]+)/gi,
    ];

    let found = false;
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const m = match as RegExpMatchArray;
        const registrationNumber = m[1].trim();
        const fullName = m[2].trim();

        if (registrationNumber && fullName && fullName.split(' ').length >= 2) {
          students.push({
            registrationNumber,
            fullName,
          });
          found = true;
        }
      }

      if (found) break;
    }

    if (!found) {
      errors.push('Não foi possível identificar matrículas e nomes no DOCX. Use o formato: "Matrícula - Nome Completo"');
    }

    return {
      success: students.length > 0,
      students,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      students: [],
      errors: [`Erro ao processar DOCX: ${error.message}`],
    };
  }
}

/**
 * Main parser function that detects file type and calls appropriate parser
 */
export async function parseStudentFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'xlsx':
    case 'xls':
      return parseExcelFile(buffer);
    case 'pdf':
      return parsePDFFile(buffer);
    case 'docx':
    case 'doc':
      return parseDOCXFile(buffer);
    default:
      return {
        success: false,
        students: [],
        errors: ['Formato de arquivo não suportado. Use .xlsx, .pdf ou .docx'],
      };
  }
}
