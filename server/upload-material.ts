import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = Router();

// Limite máximo de arquivo em bytes (75MB)
const MAX_FILE_SIZE = 75 * 1024 * 1024;

// Diretório de uploads local (fallback quando S3 não está disponível)
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'materials');

// Garantir que o diretório de uploads existe
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Configurar multer para armazenar em memória (depois enviamos ao S3 ou disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    // Aceitar todos os tipos de arquivo suportados
    const allowedMimes = [
      'application/pdf',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/webm',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/octet-stream',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/zip', 'application/x-zip-compressed',
    ];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/')) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  },
});

// Tentar upload via S3, com fallback para armazenamento local
async function uploadFile(fileKey: string, buffer: Buffer, contentType: string): Promise<{ url: string; key: string }> {
  // Tentar S3 primeiro
  try {
    const { storagePut } = await import('./storage');
    const result = await storagePut(fileKey, buffer, contentType);
    console.log(`[Upload] S3 upload successful: ${fileKey}`);
    return result;
  } catch (s3Error: any) {
    // Se o erro for de credenciais ausentes, usar armazenamento local
    if (s3Error.message?.includes('credentials missing') || s3Error.message?.includes('BUILT_IN_FORGE')) {
      console.log(`[Upload] S3 not available, using local storage for: ${fileKey}`);
      return await saveLocally(fileKey, buffer);
    }
    // Para outros erros S3, tentar local como fallback
    console.error(`[Upload] S3 error, falling back to local:`, s3Error.message);
    return await saveLocally(fileKey, buffer);
  }
}

async function saveLocally(fileKey: string, buffer: Buffer): Promise<{ url: string; key: string }> {
  ensureUploadsDir();
  
  // Sanitizar o nome do arquivo
  const sanitizedKey = fileKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(UPLOADS_DIR, sanitizedKey);
  
  // Salvar arquivo
  fs.writeFileSync(filePath, buffer);
  
  // Retornar URL relativa que será servida pelo Express
  const url = `/uploads/materials/${sanitizedKey}`;
  
  console.log(`[Upload] Local save successful: ${filePath} -> ${url}`);
  return { url, key: sanitizedKey };
}

// Endpoint de upload usando multipart/form-data (mais eficiente para arquivos grandes)
router.post('/upload-material', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'Arquivo muito grande',
            message: `O arquivo excede o limite máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB. Para arquivos maiores, use um serviço externo (Google Drive, YouTube, etc.)`,
            maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
          });
        }
        return res.status(400).json({ error: 'Erro no upload', message: err.message });
      }
      return res.status(400).json({ error: 'Erro no upload', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const file = (req as any).file;
    
    if (!file) {
      // Fallback: tentar ler do body JSON (compatibilidade com versão antiga)
      const { fileKey: bodyFileKey, fileData, contentType: bodyContentType } = req.body;
      
      if (fileData) {
        const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        if (buffer.length > MAX_FILE_SIZE) {
          return res.status(413).json({
            error: 'Arquivo muito grande',
            message: `O arquivo excede o limite máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
          });
        }
        
        const result = await uploadFile(bodyFileKey, buffer, bodyContentType);
        return res.json({ url: result.url, key: result.key });
      }
      
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fileKey = `materials/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    console.log(`[Upload] Processing file: ${fileKey}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.mimetype}`);

    // Upload to S3 or local storage
    const result = await uploadFile(fileKey, file.buffer, file.mimetype);
    
    const duration = Date.now() - startTime;
    console.log(`[Upload] Success: ${fileKey} uploaded in ${duration}ms -> ${result.url}`);

    res.json({ url: result.url, key: result.key });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Upload] Error after ${duration}ms:`, error.message || error);
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: 'Erro interno ao processar o upload. Tente novamente.'
    });
  }
});

// Endpoint para verificar espaço em disco usado por materiais
router.get('/storage-info', async (req, res) => {
  try {
    ensureUploadsDir();
    
    let totalSize = 0;
    let fileCount = 0;
    
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
        fileCount++;
      }
    }
    
    res.json({
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      fileCount,
      uploadsDir: UPLOADS_DIR,
    });
  } catch (error: any) {
    console.error('[Storage Info] Error:', error.message);
    res.status(500).json({ error: 'Erro ao verificar armazenamento' });
  }
});

// Endpoint para deletar arquivo do disco (chamado internamente)
router.delete('/delete-file', async (req, res) => {
  try {
    const { filePath: relPath } = req.body;
    
    if (!relPath || !relPath.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Caminho inválido' });
    }
    
    const fullPath = path.join(process.cwd(), relPath);
    
    // Segurança: garantir que o caminho está dentro do diretório de uploads
    const resolvedPath = path.resolve(fullPath);
    const uploadsBase = path.resolve(path.join(process.cwd(), 'uploads'));
    
    if (!resolvedPath.startsWith(uploadsBase)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      console.log(`[Storage] Arquivo deletado: ${resolvedPath}`);
      res.json({ success: true, deleted: relPath });
    } else {
      console.log(`[Storage] Arquivo não encontrado: ${resolvedPath}`);
      res.json({ success: true, deleted: null, message: 'Arquivo não encontrado no disco' });
    }
  } catch (error: any) {
    console.error('[Storage Delete] Error:', error.message);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

export default router;
