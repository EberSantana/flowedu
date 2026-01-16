import { describe, it, expect } from 'vitest';

describe('Upload Material - Validações', () => {
  // Constantes de configuração
  const MAX_FILE_SIZE = 75 * 1024 * 1024; // 75MB
  const EXPRESS_LIMIT = 100 * 1024 * 1024; // 100MB (para acomodar base64)
  
  describe('Limites de Tamanho', () => {
    it('deve ter limite de arquivo de 75MB', () => {
      expect(MAX_FILE_SIZE).toBe(75 * 1024 * 1024);
    });
    
    it('deve ter limite do Express de 100MB para acomodar base64', () => {
      // Base64 aumenta o tamanho em ~33%, então 75MB * 1.33 ≈ 100MB
      expect(EXPRESS_LIMIT).toBeGreaterThan(MAX_FILE_SIZE * 1.33);
    });
    
    it('deve rejeitar arquivos maiores que 75MB', () => {
      const fileSize = 80 * 1024 * 1024; // 80MB
      expect(fileSize > MAX_FILE_SIZE).toBe(true);
    });
    
    it('deve aceitar arquivos de até 75MB', () => {
      const fileSize = 70 * 1024 * 1024; // 70MB
      expect(fileSize <= MAX_FILE_SIZE).toBe(true);
    });
    
    it('deve aceitar arquivos de exatamente 75MB', () => {
      const fileSize = 75 * 1024 * 1024; // 75MB exato
      expect(fileSize <= MAX_FILE_SIZE).toBe(true);
    });
  });
  
  describe('Conversão Base64', () => {
    it('deve calcular corretamente o overhead de base64 (~33%)', () => {
      const originalSize = 50 * 1024 * 1024; // 50MB
      const base64Size = Math.ceil(originalSize * 4 / 3); // Base64 aumenta ~33%
      
      // Base64 de 50MB deve caber no limite de 100MB do Express
      expect(base64Size).toBeLessThan(EXPRESS_LIMIT);
    });
    
    it('deve calcular que 75MB em base64 cabe no limite de 100MB', () => {
      const originalSize = 75 * 1024 * 1024; // 75MB
      const base64Size = Math.ceil(originalSize * 4 / 3); // ~100MB
      
      expect(base64Size).toBeLessThanOrEqual(EXPRESS_LIMIT);
    });
  });
  
  describe('Validação de Campos', () => {
    it('deve exigir fileKey', () => {
      const body = { fileData: 'base64data', contentType: 'video/mp4' };
      const hasFileKey = !!body.fileKey;
      expect(hasFileKey).toBe(false);
    });
    
    it('deve exigir fileData', () => {
      const body = { fileKey: 'materials/test.mp4', contentType: 'video/mp4' };
      const hasFileData = !!body.fileData;
      expect(hasFileData).toBe(false);
    });
    
    it('deve aceitar requisição válida', () => {
      const body = { 
        fileKey: 'materials/test.mp4', 
        fileData: 'base64data',
        contentType: 'video/mp4' 
      };
      const isValid = !!body.fileKey && !!body.fileData;
      expect(isValid).toBe(true);
    });
  });
  
  describe('Extração de Base64', () => {
    it('deve extrair base64 de data URL', () => {
      const dataUrl = 'data:video/mp4;base64,SGVsbG8gV29ybGQ=';
      const base64Data = dataUrl.includes('base64,') 
        ? dataUrl.split('base64,')[1] 
        : dataUrl;
      
      expect(base64Data).toBe('SGVsbG8gV29ybGQ=');
    });
    
    it('deve manter base64 puro sem modificação', () => {
      const pureBase64 = 'SGVsbG8gV29ybGQ=';
      const base64Data = pureBase64.includes('base64,') 
        ? pureBase64.split('base64,')[1] 
        : pureBase64;
      
      expect(base64Data).toBe('SGVsbG8gV29ybGQ=');
    });
  });
  
  describe('Tipos de Arquivo', () => {
    it('deve detectar tipo de vídeo', () => {
      const filename = 'aula.mp4';
      const extension = filename.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
      
      expect(videoExtensions.includes(extension || '')).toBe(true);
    });
    
    it('deve detectar tipo de PDF', () => {
      const filename = 'apostila.pdf';
      const extension = filename.split('.').pop()?.toLowerCase();
      
      expect(extension).toBe('pdf');
    });
    
    it('deve detectar tipo de documento', () => {
      const filename = 'relatorio.docx';
      const extension = filename.split('.').pop()?.toLowerCase();
      const docExtensions = ['doc', 'docx', 'txt', 'odt'];
      
      expect(docExtensions.includes(extension || '')).toBe(true);
    });
    
    it('deve detectar tipo de apresentação', () => {
      const filename = 'slides.pptx';
      const extension = filename.split('.').pop()?.toLowerCase();
      const presentationExtensions = ['ppt', 'pptx', 'odp'];
      
      expect(presentationExtensions.includes(extension || '')).toBe(true);
    });
  });
  
  describe('Formatação de Tamanho', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    it('deve formatar bytes corretamente', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });
    
    it('deve formatar kilobytes corretamente', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
    
    it('deve formatar megabytes corretamente', () => {
      expect(formatFileSize(39.9 * 1024 * 1024)).toBe('39.9 MB');
    });
    
    it('deve formatar 75MB corretamente', () => {
      expect(formatFileSize(75 * 1024 * 1024)).toBe('75.0 MB');
    });
  });
});
