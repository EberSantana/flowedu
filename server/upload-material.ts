import { Router } from 'express';
import { storagePut } from './storage';

const router = Router();

// Limite máximo de arquivo em bytes (75MB)
const MAX_FILE_SIZE = 75 * 1024 * 1024;

router.post('/upload-material', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { fileKey, fileData, contentType } = req.body;

    if (!fileKey || !fileData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract base64 data (remove data:mime;base64, prefix if present)
    const base64Data = fileData.includes('base64,') 
      ? fileData.split('base64,')[1] 
      : fileData;

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Validar tamanho do arquivo
    if (buffer.length > MAX_FILE_SIZE) {
      console.log(`[Upload] File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return res.status(413).json({ 
        error: 'Arquivo muito grande',
        message: `O arquivo excede o limite máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB. Por favor, use um serviço de hospedagem externo para arquivos maiores.`,
        maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        actualSize: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    console.log(`[Upload] Processing file: ${fileKey}, Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB, Type: ${contentType}`);

    // Upload to S3
    const result = await storagePut(fileKey, buffer, contentType);
    
    const duration = Date.now() - startTime;
    console.log(`[Upload] Success: ${fileKey} uploaded in ${duration}ms`);

    res.json({ url: result.url, key: result.key });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Upload] Error after ${duration}ms:`, error.message || error);
    
    // Determinar tipo de erro
    if (error.message?.includes('Storage upload failed')) {
      return res.status(502).json({ 
        error: 'Erro no servidor de armazenamento',
        message: 'Não foi possível salvar o arquivo. Tente novamente em alguns instantes.'
      });
    }
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: 'Erro interno ao processar o upload. Tente novamente.'
    });
  }
});

export default router;
