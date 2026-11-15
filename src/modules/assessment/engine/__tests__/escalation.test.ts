import { describe, expect, it } from 'vitest';
import { finalizeEscalation } from '../escalation';

describe('finalizeEscalation', () => {
  it('upgrades flight_surgeon to emergency on an autonomous (Mars) environment', () => {
    expect(finalizeEscalation('flight_surgeon', { medicalCapability: 'autonomous' })).toBe(
      'emergency',
    );
  });

  it('leaves flight_surgeon as-is with ground support', () => {
    expect(finalizeEscalation('flight_surgeon', { medicalCapability: 'full_ground_support' })).toBe(
      'flight_surgeon',
    );
  });

  it('does not touch lower escalations on Mars', () => {
    expect(finalizeEscalation('crew_medical_officer', { medicalCapability: 'autonomous' })).toBe(
      'crew_medical_officer',
    );
    expect(finalizeEscalation('self_care', { medicalCapability: 'autonomous' })).toBe('self_care');
  });

  it('does not touch emergency (already the top)', () => {
    expect(finalizeEscalation('emergency', { medicalCapability: 'limited' })).toBe('emergency');
  });
});
