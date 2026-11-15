import { describe, it, expect } from 'vitest';
import { getDailyMissionPool, MISSION_POOL } from '@/lib/daily-missions';

describe('Daily Mission Pool Generator', () => {
  it('contains valid predefined missions with valid types and positive XP', () => {
    expect(MISSION_POOL.length).toBeGreaterThanOrEqual(10);
    for (const mission of MISSION_POOL) {
      expect(mission.id).toBeTruthy();
      expect(mission.title).toBeTruthy();
      expect(mission.xp).toBeGreaterThan(0);
      expect(['open_app', 'log_urge', 'replacement', 'coping_tool', 'check_savings', 'community_share', 'mood_log', 'any']).toContain(mission.type);
    }
  });

  it('deterministically returns 3 missions for a specific date', () => {
    const date = '2026-11-15';
    const set1 = getDailyMissionPool(date);
    const set2 = getDailyMissionPool(date);

    expect(set1.length).toBe(3);
    expect(set2.length).toBe(3);
    expect(set1.map(m => m.id)).toEqual(set2.map(m => m.id));
  });

  it('generates distinct mission sets across different dates', () => {
    const setA = getDailyMissionPool('2026-01-01');
    const setB = getDailyMissionPool('2026-06-15');

    // Both should have 3 items
    expect(setA.length).toBe(3);
    expect(setB.length).toBe(3);
    // At least one mission should differ between disparate dates
    const idsA = setA.map(m => m.id).join(',');
    const idsB = setB.map(m => m.id).join(',');
    expect(idsA).not.toEqual(idsB);
  });

  it('filters out community sharing missions when goal is track-only', () => {
    const missions = getDailyMissionPool('2026-03-20', 'track');
    expect(missions.some(m => m.id === 'share_victory')).toBe(false);
  });
});
