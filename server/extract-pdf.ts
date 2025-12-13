import express, { Request, Response } from 'express';
import multer from 'multer';
import * as pdfParse from 'pdf-parse';

// Estender tipo Request para incluir file do multer
interface MulterRequest extends Request {
  file?: any;
}

const router = express.Router();

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

// Endpoint para extrair texto de PDF
router.post('/extract-pdf-text', upload.single('pdf'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Nenhum arquivo enviado',
        message: 'Por favor, envie um arquivo PDF' 
      });
    }

    console.log('[PDF Extract] Processing file:', req.file.originalname, 'Size:', req.file.size);

    // Extrair texto do PDF
    const data = await (pdfParse as any).default(req.file.buffer);

    const extractedText = data.text.trim();

    if (!extractedText) {
      return res.status(400).json({
        error: 'PDF vazio',
        message: 'Não foi possível extrair texto do PDF. O arquivo pode estar vazio ou ser uma imagem escaneada.'
      });
    }

    console.log('[PDF Extract] Success! Extracted', extractedText.length, 'characters');

    return res.json({
      success: true,
      text: extractedText,
      metadata: {
        pages: data.numpages,
        filename: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error: any) {
    console.error('[PDF Extract] Error:', error);
    
    return res.status(500).json({
      error: 'Erro ao processar PDF',
      message: error.message || 'Ocorreu um erro ao extrair o texto do PDF. Tente novamente.',
    });
  }
});

export default router;
