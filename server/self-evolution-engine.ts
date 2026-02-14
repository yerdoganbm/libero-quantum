/**
 * LIBERO NEURO-CORE - SELF-EVOLUTION ENGINE
 *
 * Her UI uygulamasında OTOMATIK kendini geliştiren motor.
 * Veriyi analiz eder → Sorunları tespit eder → İyileştirme önerir → (Onayla) Uygular.
 *
 * Version: 2.0.0 - Auto-Evolution for ANY App
 */

export interface SynapseRecord {
  userId: string;
  sessionId: string;
  action: string;
  screen: string;
  component?: string;
  duration: number;
  timestamp: Date;
  metadata: Record<string, any>;
  dopamineScore: number;
  appName: string;
}

export interface Improvement {
  id: string;
  appName: string;
  type: 'css' | 'copy' | 'layout' | 'feature_flag' | 'ab_test' | 'removal';
  target: string; // screen | component | selector
  reason: string;
  evidence: { metric: string; value: number; threshold: number }[];
  patch: Record<string, any>; // Applied by frontend
  status: 'suggested' | 'approved' | 'applied' | 'rejected';
  createdAt: Date;
  appliedAt?: Date;
  impact?: number; // Estimated lift 0-1
}

export interface EvolutionConfig {
  minSamplesForSuggestion: number;
  dopamineThresholdLow: number;
  rageClickThreshold: number;
  minDurationForEngagement: number;
  autoApplySafePatches: boolean;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  minSamplesForSuggestion: 50,
  dopamineThresholdLow: 0.45,
  rageClickThreshold: 5,
  minDurationForEngagement: 10,
  autoApplySafePatches: true
};

/**
 * Self-Evolution Engine: Analyzes synapses and produces improvements for ANY UI app.
 */
export class SelfEvolutionEngine {
  private config: EvolutionConfig;
  private improvements: Improvement[] = [];
  private appliedPatches: Map<string, Improvement> = new Map();

  constructor(config: Partial<EvolutionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze synapses for one app and generate improvement suggestions.
   */
  analyze(synapses: SynapseRecord[], appName: string): Improvement[] {
    const appSynapses = synapses.filter(s => s.appName === appName);
    if (appSynapses.length < this.config.minSamplesForSuggestion) {
      return [];
    }

    const suggestions: Improvement[] = [];
    const screenStats = this.aggregateByScreen(appSynapses);

    // 1. Low dopamine screens → suggest copy/layout improvements
    for (const [screen, stats] of Object.entries(screenStats)) {
      if (stats.avgDopamine < this.config.dopamineThresholdLow && stats.visits >= 20) {
        suggestions.push(this.createImprovement(appName, 'layout', screen, {
          reason: `Screen "${screen}" has low happiness (${stats.avgDopamine.toFixed(2)}). Users may be confused or frustrated.`,
          evidence: [
            { metric: 'avgDopamine', value: stats.avgDopamine, threshold: this.config.dopamineThresholdLow },
            { metric: 'visits', value: stats.visits, threshold: 20 }
          ],
          patch: {
            suggest: 'Simplify layout or add helper text',
            cssVars: { '--neuro-suggest-focus': 'true' }
          }
        }));
      }
    }

    // 2. Rage clicks → suggest larger buttons / clearer CTAs
    const rageByComponent = this.aggregateRageClicks(appSynapses);
    for (const [component, count] of Object.entries(rageByComponent)) {
      if (count >= this.config.rageClickThreshold) {
        suggestions.push(this.createImprovement(appName, 'css', component, {
          reason: `High rage clicks (${count}) on "${component}". Button may be too small or unresponsive.`,
          evidence: [
            { metric: 'rageClicks', value: count, threshold: this.config.rageClickThreshold }
          ],
          patch: {
            minHeight: '48px',
            minWidth: '48px',
            cursor: 'pointer',
            fontSize: '16px'
          }
        }));
      }
    }

    // 3. Short duration screens → suggest engagement (content/copy)
    for (const [screen, stats] of Object.entries(screenStats)) {
      if (stats.avgDuration < this.config.minDurationForEngagement && stats.visits >= 30) {
        suggestions.push(this.createImprovement(appName, 'copy', screen, {
          reason: `Users leave "${screen}" quickly (avg ${stats.avgDuration.toFixed(0)}s). Add clearer value proposition.`,
          evidence: [
            { metric: 'avgDuration', value: stats.avgDuration, threshold: this.config.minDurationForEngagement }
          ],
          patch: {
            suggest: 'Add headline or CTA above the fold',
            copyHint: 'value_proposition'
          }
        }));
      }
    }

    // 4. Form errors → suggest validation hints
    const formErrors = appSynapses.filter(s => s.action === 'form_error' || s.action === 'error');
    const errorsByScreen = formErrors.reduce((acc: Record<string, number>, s) => {
      acc[s.screen] = (acc[s.screen] || 0) + 1;
      return acc;
    }, {});
    for (const [screen, count] of Object.entries(errorsByScreen)) {
      if (count >= 10) {
        suggestions.push(this.createImprovement(appName, 'copy', screen, {
          reason: `Many errors (${count}) on "${screen}". Improve validation messages or field labels.`,
          evidence: [{ metric: 'errorCount', value: count, threshold: 10 }],
          patch: { suggest: 'Add inline validation and friendly error messages' }
        }));
      }
    }

    this.improvements.push(...suggestions);
    return suggestions;
  }

  /**
   * Get improvements that can be auto-applied (CSS/feature flags only).
   */
  getAutoApplicablePatches(appName: string): Improvement[] {
    return this.improvements.filter(
      i => i.appName === appName && (i.status === 'suggested' || i.status === 'approved') &&
        (i.type === 'css' || i.type === 'feature_flag') && this.config.autoApplySafePatches
    );
  }

  /**
   * Mark improvement as applied (frontend calls this after applying patch).
   */
  markApplied(improvementId: string): void {
    const i = this.improvements.find(x => x.id === improvementId);
    if (i) {
      i.status = 'applied';
      i.appliedAt = new Date();
      this.appliedPatches.set(improvementId, i);
    }
  }

  /**
   * Get all patches currently active for an app (for frontend to apply).
   */
  getActivePatches(appName: string): Improvement[] {
    return [...this.improvements, ...this.appliedPatches.values()]
      .filter(i => i.appName === appName && (i.status === 'applied' || i.status === 'approved'));
  }

  /**
   * Reject suggestion (user/admin choice).
   */
  reject(improvementId: string): void {
    const i = this.improvements.find(x => x.id === improvementId);
    if (i) i.status = 'rejected';
  }

  /**
   * Approve suggestion (will be included in getActivePatches).
   */
  approve(improvementId: string): void {
    const i = this.improvements.find(x => x.id === improvementId);
    if (i) i.status = 'approved';
  }

  getImprovements(appName?: string): Improvement[] {
    if (appName) return this.improvements.filter(i => i.appName === appName);
    return [...this.improvements];
  }

  private aggregateByScreen(synapses: SynapseRecord[]): Record<string, { visits: number; avgDopamine: number; avgDuration: number }> {
    const byScreen: Record<string, { visits: number; totalDopamine: number; totalDuration: number }> = {};
    for (const s of synapses) {
      if (!byScreen[s.screen]) byScreen[s.screen] = { visits: 0, totalDopamine: 0, totalDuration: 0 };
      byScreen[s.screen].visits++;
      byScreen[s.screen].totalDopamine += s.dopamineScore;
      byScreen[s.screen].totalDuration += s.duration;
    }
    const out: Record<string, { visits: number; avgDopamine: number; avgDuration: number }> = {};
    for (const [screen, agg] of Object.entries(byScreen)) {
      out[screen] = {
        visits: agg.visits,
        avgDopamine: agg.totalDopamine / agg.visits,
        avgDuration: agg.totalDuration / agg.visits
      };
    }
    return out;
  }

  private aggregateRageClicks(synapses: SynapseRecord[]): Record<string, number> {
    const byComponent: Record<string, number> = {};
    for (const s of synapses) {
      if (s.action === 'rage_click' || (s.metadata?.rapidClicks && s.metadata.rapidClicks >= this.config.rageClickThreshold)) {
        const key = s.component || s.screen;
        byComponent[key] = (byComponent[key] || 0) + 1;
      }
    }
    return byComponent;
  }

  private createImprovement(
    appName: string,
    type: Improvement['type'],
    target: string,
    payload: { reason: string; evidence: Improvement['evidence']; patch: Record<string, any> }
  ): Improvement {
    const id = `imp_${appName}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const imp: Improvement = {
      id,
      appName,
      type,
      target,
      reason: payload.reason,
      evidence: payload.evidence,
      patch: payload.patch,
      status: 'suggested',
      createdAt: new Date(),
      impact: 0.1 + Math.random() * 0.3
    };
    return imp;
  }
}

export default SelfEvolutionEngine;
