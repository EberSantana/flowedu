import { Router } from 'express';
import { storagePut } from './storage';

const router = Router();

router.post('/upload-material', async (req, res) => {
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

    // Upload to S3
    const result = await storagePut(fileKey, buffer, contentType);

    res.json({ url: result.url, key: result.key });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
