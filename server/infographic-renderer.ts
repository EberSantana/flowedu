import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { storagePut } from './storage';

interface ModuleData {
  title: string;
  description?: string;
  topics: Array<{ title: string }>;
}

interface PathData {
  subjectName: string;
  modules: Array<{
    title: string;
    topics?: Array<{ title: string }>;
  }>;
}

/**
 * Renderiza template HTML para PNG e faz upload para S3
 */
async function renderHTMLToImage(html: string, width: number, height: number): Promise<string> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Capturar screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });
    
    await browser.close();
    
    // Upload para S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `infographics/infographic-${timestamp}-${randomSuffix}.png`;
    
    const result = await storagePut(fileKey, screenshot, 'image/png');
    
    return result.url;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Substitui placeholders no template HTML
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Substituir variáveis simples {{VARIABLE}}
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
  });
  
  // Remover blocos condicionais vazios {{#if}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}[\s\S]*?{{\/if}}/g, (match, varName) => {
    return data[varName] ? match.replace(/{{#if\s+\w+}}|{{\/if}}/g, '') : '';
  });
  
  // Processar loops {{#each}}...{{/each}}
  result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, template) => {
    const items = data[varName];
    if (!Array.isArray(items) || items.length === 0) return '';
    
    return items.map((item, index) => {
      let itemHtml = template;
      
      // Substituir {{add @index 1}} por index + 1
      itemHtml = itemHtml.replace(/{{add\s+@index\s+(\d+)}}/g, (_: string, num: string) => {
        return String(index + parseInt(num));
      });
      
      // Substituir {{this.property}}
      itemHtml = itemHtml.replace(/{{this\.(\w+)}}/g, (_: string, prop: string) => {
        return item[prop] || '';
      });
      
      // Substituir {{@index}}
      itemHtml = itemHtml.replace(/{{@index}}/g, String(index));
      
      return itemHtml;
    }).join('');
  });
  
  return result;
}

/**
 * Gera infográfico de módulo
 */
export async function generateModuleInfographic(moduleData: ModuleData): Promise<string> {
  const templatePath = join(__dirname, 'infographic-templates', 'module-template.html');
  const template = readFileSync(templatePath, 'utf-8');
  
  const data = {
    MODULE_TITLE: moduleData.title,
    MODULE_DESCRIPTION: moduleData.description || '',
    TOPICS: moduleData.topics,
    TOPICS_COUNT: moduleData.topics.length,
  };
  
  const html = replacePlaceholders(template, data);
  const imageUrl = await renderHTMLToImage(html, 1200, 800);
  
  return imageUrl;
}

/**
 * Gera infográfico da trilha completa
 */
export async function generatePathInfographic(pathData: PathData): Promise<string> {
  const templatePath = join(__dirname, 'infographic-templates', 'path-template.html');
  const template = readFileSync(templatePath, 'utf-8');
  
  const totalTopics = pathData.modules.reduce((sum, module) => {
    return sum + (module.topics?.length || 0);
  }, 0);
  
  const data = {
    SUBJECT_NAME: pathData.subjectName,
    MODULES: pathData.modules,
    MODULES_COUNT: pathData.modules.length,
    TOPICS_COUNT: totalTopics,
  };
  
  const html = replacePlaceholders(template, data);
  const imageUrl = await renderHTMLToImage(html, 1400, 1000);
  
  return imageUrl;
}
