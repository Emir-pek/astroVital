import { Download, FolderOpen, Play } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ENVIRONMENTS } from '@core/config/environments.config';
import { SCENARIOS } from '@core/simulation';
import { useHealthStore } from '@core/store';
import { Button, Card, Modal, Segmented, useToast } from '@core/ui';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { exportData, importData } from '../store/dataTransferActions';

/** A visible label above a control group (same pattern as the Settings page). */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-2">{label}</span>
      {children}
      {hint && <p className="text-label text-text-3">{hint}</p>}
    </div>
  );
}

/** Saves text as a file in the browser (no network). */
const download = (text: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Settings of the routine/demo logic as one self-contained block (Engineer 1): browser
 * notifications (asks permission on the click), automatic demo load, scenario with its recommended
 * environment, and backup export / import (import replaces the data → confirmation first).
 * Not mounted by the routine module: Engineer 4 places it on the Settings page (handoff doc).
 */
export function RoutineSettingsPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const notifications = useNotificationSettings();
  const settings = useHealthStore((s) => s.settings);
  const activeEnvironment = useHealthStore((s) => s.activeEnvironment);
  const updateSettings = useHealthStore((s) => s.updateSettings);
  const applyScenario = useHealthStore((s) => s.applyScenario);
  const [withEnv, setWithEnv] = useState<'apply' | 'keep'>('apply');
  const [pending, setPending] = useState<{ name: string; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recommended = SCENARIOS[settings.scenario].recommendedEnvironment;
  const permissionHint =
    notifications.permission === 'denied'
      ? t('routine.settings.permissionDenied')
      : notifications.permission === 'unsupported'
        ? t('routine.settings.permissionUnsupported')
        : t('routine.settings.notificationsHint');

  const onImportConfirmed = () => {
    if (!pending) return;
    const result = importData(pending.text);
    setPending(null);
    toast.show(
      result.ok
        ? { message: t('routine.settings.importDone'), tone: 'info' }
        : {
            message: t(`routine.settings.importError.${result.error}`, {
              detail: result.issues[0] ?? '',
            }),
            tone: 'caution',
            durationMs: 8000,
          },
    );
  };

  return (
    <div className="flex flex-col gap-section">
      <Card title={t('routine.settings.notificationsTitle')}>
        <Field label={t('routine.settings.notifications')} hint={permissionHint}>
          <Segmented
            label={t('routine.settings.notifications')}
            value={notifications.enabled ? 'on' : 'off'}
            options={[
              { value: 'off', label: t('routine.settings.off') },
              { value: 'on', label: t('routine.settings.on') },
            ]}
            onChange={(v) => void notifications.setEnabled(v === 'on')}
          />
        </Field>
      </Card>

      <Card title={t('routine.settings.demoTitle')}>
        <div className="flex flex-col gap-section">
          <Field label={t('routine.settings.autoLoad')} hint={t('routine.settings.autoLoadHint')}>
            <Segmented
              label={t('routine.settings.autoLoad')}
              value={settings.autoLoadDemo ? 'on' : 'off'}
              options={[
                { value: 'on', label: t('routine.settings.on') },
                { value: 'off', label: t('routine.settings.off') },
              ]}
              onChange={(v) => updateSettings({ autoLoadDemo: v === 'on' })}
            />
          </Field>
          <Field
            label={t('routine.settings.recommendedEnv', {
              scenario: t(SCENARIOS[settings.scenario].labelKey),
              env: t(ENVIRONMENTS[recommended].labelKey),
            })}
          >
            <Segmented
              label={t('routine.settings.recommendedEnvLabel')}
              value={withEnv}
              options={[
                { value: 'apply', label: t('routine.settings.applyEnv') },
                { value: 'keep', label: t('routine.settings.keepEnv') },
              ]}
              onChange={setWithEnv}
            />
          </Field>
          <div>
            <Button
              icon={<Play aria-hidden="true" className="size-6" />}
              onClick={() => {
                applyScenario(settings.scenario, {
                  withRecommendedEnvironment: withEnv === 'apply',
                });
                toast.show({ message: t('routine.settings.scenarioLoaded'), tone: 'info' });
              }}
            >
              {t('routine.settings.loadScenario', {
                env: t(
                  ENVIRONMENTS[withEnv === 'apply' ? recommended : activeEnvironment].labelKey,
                ),
              })}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('routine.settings.backupTitle')}>
        <div className="flex flex-col gap-touch-gap">
          <p className="text-body text-text-2">{t('routine.settings.backupHint')}</p>
          <div className="flex flex-wrap gap-touch-gap">
            <Button
              variant="secondary"
              icon={<Download aria-hidden="true" className="size-6" />}
              onClick={() =>
                download(
                  exportData(),
                  `astrovital-backup-${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              {t('routine.settings.export')}
            </Button>
            <Button
              variant="secondary"
              icon={<FolderOpen aria-hidden="true" className="size-6" />}
              onClick={() => fileRef.current?.click()}
            >
              {t('routine.settings.import')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              aria-label={t('routine.settings.import')}
              className="sr-only"
              tabIndex={-1}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) setPending({ name: file.name, text: await file.text() });
              }}
            />
          </div>
        </div>
      </Card>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={t('routine.settings.importConfirmTitle')}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onImportConfirmed}>{t('routine.settings.importConfirm')}</Button>
          </>
        }
      >
        <p className="text-body text-text">
          {t('routine.settings.importConfirmText', { file: pending?.name ?? '' })}
        </p>
      </Modal>
    </div>
  );
}
