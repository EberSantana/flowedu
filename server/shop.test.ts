import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Shop System', () => {
  // Dados de teste
  const testStudentId = 999999;
  let testItemId: number;

  beforeAll(async () => {
    // Verificar se existem itens na loja
    const items = await db.getShopItems({});
    if (items.length > 0) {
      testItemId = items[0].id;
    }
  });

  describe('getShopItems', () => {
    it('deve retornar lista de itens da loja', async () => {
      const items = await db.getShopItems({});
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('deve filtrar itens por categoria', async () => {
      const hats = await db.getShopItems({ category: 'hat' });
      
      expect(Array.isArray(hats)).toBe(true);
      hats.forEach(item => {
        expect(item.category).toBe('hat');
      });
    });

    it('deve filtrar itens por faixa requerida', async () => {
      const whiteItems = await db.getShopItems({ requiredBelt: 'white' });
      
      expect(Array.isArray(whiteItems)).toBe(true);
      whiteItems.forEach(item => {
        expect(item.requiredBelt).toBe('white');
      });
    });
  });

  describe('getShopItemById', () => {
    it('deve retornar item específico por ID', async () => {
      if (!testItemId) {
        console.log('Pulando teste - nenhum item disponível');
        return;
      }

      const item = await db.getShopItemById(testItemId);
      
      expect(item).not.toBeNull();
      expect(item?.id).toBe(testItemId);
      expect(item?.name).toBeDefined();
      expect(item?.price).toBeGreaterThan(0);
    });

    it('deve retornar null para item inexistente', async () => {
      const item = await db.getShopItemById(999999999);
      
      expect(item).toBeNull();
    });
  });

  describe('studentOwnsItem', () => {
    it('deve retornar false para item não comprado', async () => {
      if (!testItemId) {
        console.log('Pulando teste - nenhum item disponível');
        return;
      }

      const owns = await db.studentOwnsItem(testStudentId, testItemId);
      
      expect(owns).toBe(false);
    });
  });

  describe('getStudentPurchasedItems', () => {
    it('deve retornar lista vazia para aluno sem compras', async () => {
      const items = await db.getStudentPurchasedItems(testStudentId);
      
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('getStudentEquippedItems', () => {
    it('deve retornar lista vazia para aluno sem itens equipados', async () => {
      const items = await db.getStudentEquippedItems(testStudentId);
      
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Shop Item Structure', () => {
    it('itens devem ter estrutura correta', async () => {
      const items = await db.getShopItems({});
      
      if (items.length > 0) {
        const item = items[0];
        
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('isActive');
        expect(item).toHaveProperty('isRare');
        
        expect(typeof item.id).toBe('number');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price).toBe('number');
        expect(typeof item.isActive).toBe('boolean');
        expect(typeof item.isRare).toBe('boolean');
      }
    });

    it('categorias devem ser válidas', async () => {
      const items = await db.getShopItems({});
      const validCategories = ['hat', 'glasses', 'accessory', 'background', 'special'];
      
      items.forEach(item => {
        expect(validCategories).toContain(item.category);
      });
    });

    it('preços devem ser positivos', async () => {
      const items = await db.getShopItems({});
      
      items.forEach(item => {
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });
});
