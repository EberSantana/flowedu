import { describe, it, expect } from 'vitest';
import { HD2D_CHARACTERS, getCharacterById, getNextCharacterToUnlock } from '../shared/hd2d-characters';

/**
 * Testes para o sistema de avatares HD-2D
 * Valida lógica de personagens, desbloqueio e configurações
 */

describe('Sistema de Avatares HD-2D', () => {

  it('Deve ter 8 personagens HD-2D disponíveis', () => {
    expect(HD2D_CHARACTERS).toHaveLength(8);
    expect(HD2D_CHARACTERS[0].id).toBe(1);
    expect(HD2D_CHARACTERS[7].id).toBe(8);
  });

  it('Deve retornar personagem por ID corretamente', () => {
    const warrior = getCharacterById(1);
    expect(warrior).toBeDefined();
    expect(warrior?.name).toBe('Warrior');
    expect(warrior?.unlockPoints).toBe(0);
    
    const scholar = getCharacterById(2);
    expect(scholar).toBeDefined();
    expect(scholar?.name).toBe('Scholar');
    expect(scholar?.unlockPoints).toBe(500);
  });

  it('Deve retornar null para ID inválido', () => {
    const invalid = getCharacterById(99);
    expect(invalid).toBeUndefined();
    
    const zero = getCharacterById(0);
    expect(zero).toBeUndefined();
  });

  it('Deve calcular próximo personagem a desbloquear', () => {
    // Com 0 pontos, próximo é Scholar (500 pontos)
    const next1 = getNextCharacterToUnlock(0);
    expect(next1?.id).toBe(2);
    expect(next1?.unlockPoints).toBe(500);
    
    // Com 600 pontos, próximo é Guardian (1000 pontos)
    const next2 = getNextCharacterToUnlock(600);
    expect(next2?.id).toBe(3);
    
    // Com 10000 pontos, todos desbloqueados
    const next3 = getNextCharacterToUnlock(10000);
    expect(next3).toBeNull();
  });

  it('Deve ter pontos de desbloqueio crescentes', () => {
    for (let i = 0; i < HD2D_CHARACTERS.length - 1; i++) {
      expect(HD2D_CHARACTERS[i].unlockPoints).toBeLessThanOrEqual(
        HD2D_CHARACTERS[i + 1].unlockPoints
      );
    }
  });

  it('Deve ter todos os campos obrigatórios', () => {
    HD2D_CHARACTERS.forEach(character => {
      expect(character.id).toBeGreaterThanOrEqual(1);
      expect(character.id).toBeLessThanOrEqual(8);
      expect(character.name).toBeTruthy();
      expect(character.title).toBeTruthy();
      expect(character.description).toBeTruthy();
      expect(character.personality).toBeTruthy();
      expect(character.specialAbility).toBeTruthy();
      expect(character.imagePath).toBeTruthy();
      expect(character.auraColor).toBeTruthy();
      expect(character.unlockLevel).toBeGreaterThanOrEqual(1);
      expect(character.unlockPoints).toBeGreaterThanOrEqual(0);
    });
  });

  it('Deve ter cores de aura únicas e válidas', () => {
    const colors = HD2D_CHARACTERS.map(c => c.auraColor);
    const uniqueColors = new Set(colors);
    
    // Cada personagem deve ter cor única
    expect(uniqueColors.size).toBe(HD2D_CHARACTERS.length);
    
    // Cores devem estar em formato hex ou rgb
    colors.forEach(color => {
      expect(color).toMatch(/^(#[0-9A-Fa-f]{6}|rgb\(|rgba\(|hsl\()/);
    });
  });

  it('Deve ter caminhos de imagem corretos', () => {
    HD2D_CHARACTERS.forEach(character => {
      expect(character.imagePath).toContain('/avatars/');
      expect(character.imagePath).toContain('.png');
      expect(character.imagePath).toContain('character-');
    });
  });
});
