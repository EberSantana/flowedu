import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain', // .txt
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use PDF, DOCX ou TXT.'));
    }
  },
});

// Endpoint para extrair texto de PDF, DOCX ou TXT
router.post('/extract-pdf-text', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
      });
    }

    console.log('[File Extract] Processing file:', req.file.originalname, 'Type:', req.file.mimetype, 'Size:', req.file.size);

    let extractedText = '';
    let metadata: any = {
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    };

    // Processar baseado no tipo de arquivo
    if (req.file.mimetype === 'application/pdf') {
      // Extrair texto do PDF usando require
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text.trim();
      metadata.pages = data.numpages;
      metadata.fileType = 'PDF';
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extrair texto do DOCX
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value.trim();
      metadata.fileType = 'DOCX';
      
      if (result.messages.length > 0) {
        console.log('[File Extract] Mammoth warnings:', result.messages);
      }
    } else if (req.file.mimetype === 'text/plain') {
      // Extrair texto do TXT
      extractedText = req.file.buffer.toString('utf-8').trim();
      metadata.fileType = 'TXT';
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível extrair texto do arquivo. O arquivo pode estar vazio ou corrompido.',
      });
    }

    console.log('[File Extract] Success! Extracted', extractedText.length, 'characters');

    return res.json({
      success: true,
      text: extractedText,
      metadata,
    });
  } catch (error: any) {
    console.error('[File Extract] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar arquivo',
    });
  }
});

export default router;
