import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getDb } from './db';
import { backups } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { verifySessionToken } from './_core/auth-standalone';

const router = Router();

/**
 * GET /api/backup/download/:id
 * Faz download de um arquivo de backup (local ou redireciona para S3)
 * Requer autenticação (admin)
 */
router.get('/backup/download/:id', async (req: Request, res: Response) => {
  try {
    // Verificar autenticação via cookie de sessão
    const sessionToken = req.cookies?.session;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await verifySessionToken(sessionToken);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem baixar backups.' });
    }

    const backupId = parseInt(req.params.id);
    if (isNaN(backupId)) {
      return res.status(400).json({ error: 'ID de backup inválido' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados indisponível' });
    }

    const [backup] = await db.select().from(backups).where(eq(backups.id, backupId)).limit(1);

    if (!backup) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: 'Backup não está completo' });
    }

    // Se tem URL do S3, redirecionar para lá
    if (backup.s3Url && (backup.storageType === 's3' || backup.storageType === 'both')) {
      return res.redirect(backup.s3Url);
    }

    // Senão, servir arquivo local
    const filepath = backup.filepath;
    if (!filepath) {
      return res.status(404).json({ error: 'Caminho do arquivo não encontrado' });
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado no servidor. Pode ter sido deletado.' });
    }

    const filename = backup.filename || path.basename(filepath);
    const fileSize = fs.statSync(filepath).size;

    // Enviar arquivo como download
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileSize);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('[Backup Download] Erro ao ler arquivo:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao ler arquivo de backup' });
      }
    });

  } catch (error: any) {
    console.error('[Backup Download] Erro:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno ao processar download' });
    }
  }
});

export { router as backupDownloadRouter };
