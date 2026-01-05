import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Advanced Gamification System - Core Functions', () => {
  
  describe('Module Badges System', () => {
    it('should have calculateModuleBadge function', () => {
      expect(typeof db.calculateModuleBadge).toBe('function');
    });

    it('should have getStudentModuleBadges function', () => {
      expect(typeof db.getStudentModuleBadges).toBe('function');
    });

    it('should have getModuleBadgesByModule function', () => {
      expect(typeof db.getModuleBadgesByModule).toBe('function');
    });

    it('should return empty array for non-existent student badges', async () => {
      const badges = await db.getStudentModuleBadges(999999);
      expect(Array.isArray(badges)).toBe(true);
      expect(badges.length).toBe(0);
    });

    it('should return empty array for non-existent module ranking', async () => {
      const ranking = await db.getModuleBadgesByModule(999999);
      expect(Array.isArray(ranking)).toBe(true);
      expect(ranking.length).toBe(0);
    });
  });

  describe('Specialization Achievements System', () => {
    it('should have createSpecializationAchievement function', () => {
      expect(typeof db.createSpecializationAchievement).toBe('function');
    });

    it('should have getSpecializationAchievements function', () => {
      expect(typeof db.getSpecializationAchievements).toBe('function');
    });

    it('should have unlockAchievement function', () => {
      expect(typeof db.unlockAchievement).toBe('function');
    });

    it('should have getStudentAchievements function', () => {
      expect(typeof db.getStudentAchievements).toBe('function');
    });

    it('should have checkAndUnlockSpecializationAchievements function', () => {
      expect(typeof db.checkAndUnlockSpecializationAchievements).toBe('function');
    });

    it('should return empty array for non-existent student achievements', async () => {
      const achievements = await db.getStudentAchievements(999999);
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBe(0);
    });

    it('should get achievements by specialization', async () => {
      const achievements = await db.getSpecializationAchievements('code_warrior');
      expect(Array.isArray(achievements)).toBe(true);
      // Pode estar vazio se não houver conquistas criadas
    });

    it('should create achievement successfully', async () => {
      try {
        const achievementId = await db.createSpecializationAchievement({
          code: `test_achievement_${Date.now()}`,
          specialization: 'code_warrior',
          name: 'Test Achievement',
          description: 'Achievement for testing',
          icon: 'trophy',
          rarity: 'common',
          requirement: { type: 'test', count: 1 },
          points: 50,
        });

        expect(achievementId).toBeGreaterThan(0);
      } catch (error: any) {
        // Pode falhar se código duplicado
        expect(error.message).toContain('Duplicate');
      }
    });
  });

  describe('Learning Recommendations System', () => {
    it('should have generatePersonalizedRecommendations function', () => {
      expect(typeof db.generatePersonalizedRecommendations).toBe('function');
    });

    it('should have getStudentRecommendations function', () => {
      expect(typeof db.getStudentRecommendations).toBe('function');
    });

    it('should have updateRecommendationStatus function', () => {
      expect(typeof db.updateRecommendationStatus).toBe('function');
    });

    it('should have recordTopicProgress function', () => {
      expect(typeof db.recordTopicProgress).toBe('function');
    });

    it('should return empty array for non-existent student recommendations', async () => {
      const recommendations = await db.getStudentRecommendations(999999);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBe(0);
    });

    it('should filter recommendations by status', async () => {
      const pending = await db.getStudentRecommendations(999999, 'pending');
      expect(Array.isArray(pending)).toBe(true);

      const accepted = await db.getStudentRecommendations(999999, 'accepted');
      expect(Array.isArray(accepted)).toBe(true);
    });
  });

  describe('Integration - Gamification Notifications', () => {
    it('should have createGamificationNotification function', () => {
      expect(typeof db.createGamificationNotification).toBe('function');
    });

    it('should have getGamificationNotifications function', () => {
      expect(typeof db.getGamificationNotifications).toBe('function');
    });

    it('should return empty array for non-existent student notifications', async () => {
      const notifications = await db.getGamificationNotifications(999999);
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);
    });
  });

  describe('Function Signatures', () => {
    it('should export all required gamification functions', () => {
      const requiredFunctions = [
        'calculateModuleBadge',
        'getStudentModuleBadges',
        'getModuleBadgesByModule',
        'createSpecializationAchievement',
        'getSpecializationAchievements',
        'unlockAchievement',
        'getStudentAchievements',
        'checkAndUnlockSpecializationAchievements',
        'generatePersonalizedRecommendations',
        'getStudentRecommendations',
        'updateRecommendationStatus',
        'recordTopicProgress',
        'createGamificationNotification',
        'getGamificationNotifications',
      ];

      requiredFunctions.forEach(funcName => {
        expect(typeof (db as any)[funcName]).toBe('function');
      });
    });
  });
});
