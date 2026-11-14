import { ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PlaceholderNotice } from '@core/ui';

export interface UltrasoundUploadProps {
  crewId?: string;
}

/**
 * STUB. TODO(Engineer 2, P1): image upload → organ label (heart / bladder / optic nerve
 * sheath for SANS) → canvas caliper distance → note; images in IndexedDB (attachmentId).
 */
export function UltrasoundUpload(_props: UltrasoundUploadProps) {
  const { t } = useTranslation();
  return (
    <Card title={t('intake.ultrasound.title')} placeholder>
      <PlaceholderNotice text={t('common.stubNotice', { owner: 'Engineer 2' })} />
      <EmptyState
        icon={<ScanLine aria-hidden="true" className="size-8" />}
        title={t('common.comingSoon')}
        description={t('intake.ultrasound.description')}
      />
    </Card>
  );
}
