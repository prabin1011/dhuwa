import { describe, it, expect } from 'vitest';
import {
  computeTotalXp,
  getLevelForXp,
  computeStreaks,
  getGamificationStats,
  XP_REWARDS,
  LEVELS
} from '@/lib/gamification';

describe('Gamification Engine', () => {
  describe('computeTotalXp', () => {
    it('calculates zero XP when no activities or milestones are completed', () => {
      const xp = computeTotalXp({
        urgeCount: 0,
        replacementCount: 0,
        checkinCount: 0,
        bonusXp: 0,
        streakDays: 0,
      });
      expect(xp).toBe(0);
    });

    it('correctly aggregates direct activity rewards', () => {
      const xp = computeTotalXp({
        urgeCount: 4,          // 4 * 25 = 100
        replacementCount: 2,   // 2 * 75 = 150
        checkinCount: 5,       // 5 * 10 = 50
        bonusXp: 200,          // 200
        streakDays: 0,
      });
      expect(xp).toBe(500);
    });

    it('awards milestone XP thresholds progressively based on streak', () => {
      // 1 day streak threshold
      const xp1 = computeTotalXp({
        urgeCount: 0,
        replacementCount: 0,
        checkinCount: 0,
        bonusXp: 0,
        streakDays: 1,
      });
      expect(xp1).toBe(XP_REWARDS.STREAK_1_DAY);

      // 7 days streak threshold awards 1d, 3d, and 7d milestones
      const xp7 = computeTotalXp({
        urgeCount: 0,
        replacementCount: 0,
        checkinCount: 0,
        bonusXp: 0,
        streakDays: 7,
      });
      expect(xp7).toBe(
        XP_REWARDS.STREAK_1_DAY + XP_REWARDS.STREAK_3_DAYS + XP_REWARDS.STREAK_7_DAYS
      );
    });
  });

  describe('getLevelForXp', () => {
    it('returns Level 1 Spark for 0 XP', () => {
      const level = getLevelForXp(0);
      expect(level.level).toBe(1);
      expect(level.name).toBe('Spark');
    });

    it('maps intermediate XP to the correct level band', () => {
      const levelEmber = getLevelForXp(150);
      expect(levelEmber.level).toBe(2);
      expect(levelEmber.name).toBe('Ember');

      const levelFlame = getLevelForXp(300);
      expect(levelFlame.level).toBe(3);
      expect(levelFlame.name).toBe('Flame');
    });

    it('handles max level thresholds correctly', () => {
      const maxLevel = getLevelForXp(50000);
      expect(maxLevel.level).toBe(28);
      expect(maxLevel.name).toBe('Dhuwa Legend');
    });
  });

  describe('computeStreaks', () => {
    it('returns zeroes when urge history is empty', () => {
      const res = computeStreaks([]);
      expect(res.currentStreakDays).toBe(0);
      expect(res.longestStreakDays).toBe(0);
    });

    it('computes days elapsed since most recent urge', () => {
      const twoDaysAgo = new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000);
      const res = computeStreaks([{ timestamp: twoDaysAgo.toISOString() }]);
      expect(res.currentStreakDays).toBe(2);
    });
  });

  describe('getGamificationStats', () => {
    it('produces cohesive user progress percentage towards next tier', () => {
      const stats = getGamificationStats({
        urgeCount: 2,
        replacementCount: 1,
        checkinCount: 1,
        bonusXp: 0,
        urges: [],
      });
      expect(stats.totalXp).toBeGreaterThan(0);
      expect(stats.currentLevel.level).toBeGreaterThanOrEqual(1);
      expect(stats.progressPercent).toBeGreaterThanOrEqual(0);
      expect(stats.progressPercent).toBeLessThanOrEqual(100);
    });
  });
});
