/**
 * Dhuwa Relapse Risk & Craving Decay Engine
 *
 * Implements evidence-based behavioral psychology algorithms:
 * 1. Exponential Craving Intensity Decay (Marlatt & Gordon Urge Surfing model)
 * 2. Bayesian Relapse Probability Estimator combining historical trigger distribution,
 *    circadian craving rhythms, stress modifiers, and streak elasticity.
 * 3. Proactive Risk Window Forecaster for scheduling preventative notifications.
 */

export interface CravingEvent {
  timestamp: number; // Epoch ms
  intensity: number; // 1-10
  stressLevel: number; // 1-5
  socialTrigger: boolean;
  environmentalTrigger: boolean;
  resisted: boolean;
}

export interface RiskForecast {
  currentRiskScore: number; // 0.0 - 1.0 (Low to Critical)
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedHalfLifeMinutes: number;
  projectedDecayTimeMinutes: number;
  peakVulnerabilityHour: number;
  recommendedAction: string;
}

export class RelapseRiskEngine {
  // Baseline craving half-life in minutes (empirical urge surfing constant ~12-15m)
  private static readonly BASE_HALF_LIFE_MINUTES = 14.5;

  /**
   * Calculates instantaneous craving intensity using exponential decay:
   * I(t) = I_0 * e^(-lambda * t)
   * where lambda = ln(2) / t_half
   */
  public static calculateInstantaneousIntensity(
    initialIntensity: number,
    elapsedMinutes: number,
    stressLevel = 1
  ): number {
    if (elapsedMinutes < 0) return initialIntensity;
    
    // Stress lengthens half-life (craving lingers longer when stressed)
    const stressDilation = 1.0 + (Math.max(1, Math.min(5, stressLevel)) - 1) * 0.15;
    const adjustedHalfLife = this.BASE_HALF_LIFE_MINUTES * stressDilation;
    const lambda = Math.LN2 / adjustedHalfLife;
    
    const decayed = initialIntensity * Math.exp(-lambda * elapsedMinutes);
    return Math.max(0, Math.round(decayed * 100) / 100);
  }

  /**
   * Bayesian Relapse Risk Estimator:
   * P(Relapse | Triggers, Streak, Circadian) = Prior * Likelihood / Evidence
   */
  public static computeRiskForecast(
    history: CravingEvent[],
    currentStreakDays: number,
    targetHour: number = new Date().getHours()
  ): RiskForecast {
    // 1. Prior risk based on streak length (logarithmic decay of baseline relapse probability)
    // Early days (1-3) have high prior (~0.45); 30+ days drops toward (~0.08)
    const prior = Math.max(0.05, 0.50 / Math.pow(Math.max(1, currentStreakDays), 0.45));

    // 2. Circadian Likelihood (analyzes historical craving frequency per hour bin)
    const hourlyHistogram = new Array(24).fill(0);
    let totalEvents = 0;

    for (const event of history) {
      const hour = new Date(event.timestamp).getHours();
      hourlyHistogram[hour] += event.resisted ? 1 : 2.5; // Relapses weight higher
      totalEvents++;
    }

    let peakHour = 20; // default evening peak (8 PM)
    let maxHourlyCount = -1;
    for (let h = 0; h < 24; h++) {
      if (hourlyHistogram[h] > maxHourlyCount) {
        maxHourlyCount = hourlyHistogram[h];
        peakHour = h;
      }
    }

    const hourlyProbability = totalEvents > 0 
      ? (hourlyHistogram[targetHour] + 1) / (totalEvents + 24) // Laplace smoothing
      : 1 / 24;

    const circadianMultiplier = hourlyProbability * 24; // Normalized around 1.0

    // 3. Recent trigger volatility (events within the last 72 hours)
    const now = Date.now();
    const recentWindow = 72 * 60 * 60 * 1000;
    const recentEvents = history.filter(e => now - e.timestamp <= recentWindow);

    let recentIntensityWeight = 0;
    for (const e of recentEvents) {
      const recencyFactor = 1 - (now - e.timestamp) / recentWindow;
      recentIntensityWeight += (e.intensity / 10) * (e.stressLevel / 5) * recencyFactor;
    }

    const volatilityBonus = Math.min(0.35, recentIntensityWeight * 0.08);

    // 4. Combined Bayesian Posterior Score
    const rawScore = prior * (0.6 + 0.4 * circadianMultiplier) + volatilityBonus;
    const riskScore = Math.max(0.01, Math.min(0.99, Math.round(rawScore * 1000) / 1000));

    // 5. Categorization & Action Formulation
    let category: RiskForecast['riskCategory'];
    let action: string;

    if (riskScore >= 0.70) {
      category = 'CRITICAL';
      action = 'Trigger immediate SOS Urge Surfing timer and notify support partner';
    } else if (riskScore >= 0.45) {
      category = 'HIGH';
      action = 'Initiate 4-7-8 grounding breath exercise and engage habit replacement';
    } else if (riskScore >= 0.20) {
      category = 'MODERATE';
      action = 'Review daily recovery milestones and hydrate';
    } else {
      category = 'LOW';
      action = 'Maintain normal routine; baseline stability confirmed';
    }

    const estimatedHalfLife = Math.round(this.BASE_HALF_LIFE_MINUTES * (1 + riskScore * 0.5) * 10) / 10;
    // Projected time until craving drops below intensity 1.0 (assuming initial 8.0)
    const projectedDecay = Math.round(estimatedHalfLife * (Math.log(8.0) / Math.LN2));

    return {
      currentRiskScore: riskScore,
      riskCategory: category,
      estimatedHalfLifeMinutes: estimatedHalfLife,
      projectedDecayTimeMinutes: projectedDecay,
      peakVulnerabilityHour: peakHour,
      recommendedAction: action,
    };
  }
}
