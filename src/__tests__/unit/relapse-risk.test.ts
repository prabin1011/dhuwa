import { describe, it, expect } from 'vitest';
import { RelapseRiskEngine, type CravingEvent } from '@/lib/relapse-risk-engine';

describe('Relapse Risk & Exponential Decay Engine', () => {
  describe('calculateInstantaneousIntensity', () => {
    it('returns full initial intensity at elapsed time 0', () => {
      const val = RelapseRiskEngine.calculateInstantaneousIntensity(8.0, 0, 1);
      expect(val).toBe(8.0);
    });

    it('halves intensity after approximately one baseline half-life (~14.5 mins)', () => {
      const initial = 8.0;
      const atHalfLife = RelapseRiskEngine.calculateInstantaneousIntensity(initial, 14.5, 1);
      expect(atHalfLife).toBeCloseTo(4.0, 1);
    });

    it('decays monotonically as elapsed time increases', () => {
      const t0 = RelapseRiskEngine.calculateInstantaneousIntensity(9.0, 0);
      const t15 = RelapseRiskEngine.calculateInstantaneousIntensity(9.0, 15);
      const t30 = RelapseRiskEngine.calculateInstantaneousIntensity(9.0, 30);
      const t60 = RelapseRiskEngine.calculateInstantaneousIntensity(9.0, 60);

      expect(t0).toBeGreaterThan(t15);
      expect(t15).toBeGreaterThan(t30);
      expect(t30).toBeGreaterThan(t60);
      expect(t60).toBeLessThan(1.0);
    });

    it('stress dilates craving half-life and slows down decay', () => {
      const relaxed = RelapseRiskEngine.calculateInstantaneousIntensity(8.0, 15, 1);
      const stressed = RelapseRiskEngine.calculateInstantaneousIntensity(8.0, 15, 5);

      expect(stressed).toBeGreaterThan(relaxed);
    });
  });

  describe('computeRiskForecast', () => {
    it('assigns high baseline risk for brand new streaks (Day 1)', () => {
      const forecast = RelapseRiskEngine.computeRiskForecast([], 1, 14);
      expect(forecast.currentRiskScore).toBeGreaterThan(0.20);
      expect(['MODERATE', 'HIGH', 'CRITICAL']).toContain(forecast.riskCategory);
    });

    it('shows significantly reduced baseline risk for long streaks (90+ Days)', () => {
      const early = RelapseRiskEngine.computeRiskForecast([], 1, 12);
      const veteran = RelapseRiskEngine.computeRiskForecast([], 90, 12);

      expect(veteran.currentRiskScore).toBeLessThan(early.currentRiskScore);
      expect(veteran.riskCategory).toBe('LOW');
    });

    it('elevates risk when recent high-intensity triggers are recorded', () => {
      const now = Date.now();
      const acuteEvents: CravingEvent[] = [
        {
          timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
          intensity: 9,
          stressLevel: 5,
          socialTrigger: true,
          environmentalTrigger: false,
          resisted: false,
        },
        {
          timestamp: now - 6 * 60 * 60 * 1000,
          intensity: 8,
          stressLevel: 4,
          socialTrigger: false,
          environmentalTrigger: true,
          resisted: true,
        },
      ];

      const baseline = RelapseRiskEngine.computeRiskForecast([], 10, 19);
      const volatile = RelapseRiskEngine.computeRiskForecast(acuteEvents, 10, 19);

      expect(volatile.currentRiskScore).toBeGreaterThan(baseline.currentRiskScore);
      expect(volatile.recommendedAction).toBeTruthy();
    });

    it('detects peak vulnerability hour from circadian history', () => {
      const targetPeakHour = 21; // 9 PM
      const mockHistory: CravingEvent[] = [];
      const baseDate = new Date();
      baseDate.setHours(targetPeakHour, 15, 0, 0);

      for (let i = 0; i < 5; i++) {
        mockHistory.push({
          timestamp: baseDate.getTime() - i * 24 * 60 * 60 * 1000,
          intensity: 7,
          stressLevel: 3,
          socialTrigger: false,
          environmentalTrigger: false,
          resisted: true,
        });
      }

      const forecast = RelapseRiskEngine.computeRiskForecast(mockHistory, 5, targetPeakHour);
      expect(forecast.peakVulnerabilityHour).toBe(targetPeakHour);
    });
  });
});
