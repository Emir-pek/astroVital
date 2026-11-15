import type { EnvironmentProfile, Escalation, MetricId, Recommendation, Status } from '@core/types';

/** Which action category a metric's self-care guidance falls into when it is not nominal. */
const METRIC_CATEGORY: Partial<Record<MetricId, Recommendation['category']>> = {
  sleepHours: 'rest',
  mood: 'psych_support',
  exerciseMinutes: 'exercise',
  bloodGlucose: 'nutrition',
  bodyTemp: 'hydration',
  systolicBP: 'medication_consult',
  diastolicBP: 'medication_consult',
  heartRate: 'medication_consult',
  spo2: 'medication_consult',
  respRate: 'medication_consult',
  radiationDose: 'radiation_shelter',
};

/** camelCase i18n segment for each category (`assessment.recommendations.<segment>.*`). */
const CATEGORY_I18N_KEY: Record<Recommendation['category'], string> = {
  rest: 'rest',
  hydration: 'hydration',
  exercise: 'exercise',
  nutrition: 'nutrition',
  medication_consult: 'medicationConsult',
  radiation_shelter: 'radiationShelter',
  psych_support: 'psychSupport',
  remeasure: 'remeasure',
  contact_cmo: 'contactCmo',
  contact_flight_surgeon: 'contactFlightSurgeon',
};

const twoSteps = (i18nKey: string): string[] => [`${i18nKey}.step1`, `${i18nKey}.step2`];

export interface RecommendationInput {
  metric: MetricId;
  status: Status;
  /** Escalation AFTER `finalizeEscalation` (Mars upgrade already applied). */
  escalation: Escalation;
  /** True when this `radiationDose` result was triggered by the SPE rule, not the cumulative band. */
  isSolarParticleEvent: boolean;
  environment: Pick<EnvironmentProfile, 'medicalCapability'>;
}

/**
 * Plain-language action list for one assessment (docs/modules/assessment.md § P1 öneri
 * kütüphanesi). Nominal results get none. Every red/emergency result gets a mandatory
 * "remeasure" entry (docs/THRESHOLDS.md § Eskalasyon kuralı 5); every CMO/flight-surgeon
 * escalation gets a "who to contact" entry, with an autonomous-protocol variant on Mars
 * (flight surgeon contact becomes an asynchronous report once ground support is minutes away).
 */
export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const { metric, status, escalation, isSolarParticleEvent, environment } = input;
  if (status === 'nominal') return [];

  const recommendations: Recommendation[] = [];

  const category = METRIC_CATEGORY[metric];
  if (category === 'radiation_shelter' && isSolarParticleEvent) {
    const key = 'assessment.recommendations.radiationShelterSpe';
    recommendations.push({
      id: 'radiation-shelter-spe',
      titleKey: `${key}.title`,
      stepsKeys: twoSteps(key),
      urgency: status,
      category: 'radiation_shelter',
    });
  } else if (category) {
    const key = `assessment.recommendations.${CATEGORY_I18N_KEY[category]}`;
    recommendations.push({
      id: category,
      titleKey: `${key}.title`,
      stepsKeys: twoSteps(key),
      urgency: status,
      category,
    });
  }

  if (escalation === 'flight_surgeon' || escalation === 'emergency') {
    const autonomous = environment.medicalCapability === 'autonomous';
    const key = 'assessment.recommendations.contactFlightSurgeon';
    recommendations.push({
      id: 'contact-flight-surgeon',
      titleKey: `${key}.title`,
      stepsKeys: autonomous ? [`${key}.stepAutonomous1`, `${key}.stepAutonomous2`] : twoSteps(key),
      urgency: status,
      category: 'contact_flight_surgeon',
    });
  } else if (escalation === 'crew_medical_officer') {
    const key = 'assessment.recommendations.contactCmo';
    recommendations.push({
      id: 'contact-cmo',
      titleKey: `${key}.title`,
      stepsKeys: twoSteps(key),
      urgency: status,
      category: 'contact_cmo',
    });
  }

  // Mandatory on every RED result (docs/THRESHOLDS.md § Eskalasyon kuralı 5): "kırmızı/acilde
  // yeniden ölç zorunlu". `status === 'warning'` IS the red band (see status legend).
  if (status === 'warning') {
    const key = 'assessment.recommendations.remeasure';
    recommendations.push({
      id: 'remeasure',
      titleKey: `${key}.title`,
      stepsKeys: twoSteps(key),
      urgency: status,
      category: 'remeasure',
    });
  }

  return recommendations;
}
