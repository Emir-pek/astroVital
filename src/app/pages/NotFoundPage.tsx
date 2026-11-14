import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from './PageHeader';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('pages.notFound.title')} subtitle={t('pages.notFound.body')} />
      <Link to="/" className="text-accent underline">
        {t('pages.notFound.back')}
      </Link>
    </>
  );
}
