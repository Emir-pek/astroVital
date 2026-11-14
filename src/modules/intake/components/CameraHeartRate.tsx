import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PlaceholderNotice } from '@core/ui';

export interface CameraHeartRateProps {
  crewId?: string;
}

/**
 * STUB. TODO(Engineer 2, P1): getUserMedia → green-channel mean per frame → band-pass
 * 0.7–3.5 Hz → peak detection → bpm + confidence; fallback to manual entry; source 'camera'.
 * Scientific basis: Verkruysse et al. 2008 (docs/SOURCES.md 'verkruysse-2008-rppg').
 */
export function CameraHeartRate(_props: CameraHeartRateProps) {
  const { t } = useTranslation();
  return (
    <Card title={t('intake.camera.title')} placeholder>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 2' })} />
      <EmptyState
        icon={<Camera aria-hidden="true" className="size-8" />}
        title={t('common.comingSoon')}
        description={t('intake.camera.description')}
      />
    </Card>
  );
}
