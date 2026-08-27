import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/client';
import type { Registration, SurveyQuestion } from '@/lib/api/types';
import { Card, Callout } from '@/components/ui';
import { SurveyForm } from './SurveyForm';
import styles from '../registration.module.css';

export const metadata: Metadata = { title: 'Post-event survey', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ reference: string }>;

interface SurveyResponse {
  questions: SurveyQuestion[];
  answers: Record<string, string>;
}

export default async function SurveyPage({ params }: { params: Params }) {
  const { reference } = await params;

  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/registrations/${reference}/survey`)}`);

  let registration: Registration;
  try {
    const { data } = await apiAsUser<Registration>(`/registrations/${encodeURIComponent(reference)}`);
    registration = data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }

  const { data: survey } = await apiAsUser<SurveyResponse>(`/registrations/${encodeURIComponent(reference)}/evaluation`);

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <Link href={`/dashboard/registrations/${reference}`} className={styles.back}>
          <span aria-hidden="true">← </span>Back to your registration
        </Link>

        <header className={styles.head}>
          <h1 className={styles.title}>
            Post-event survey{registration.event ? ` — ${registration.event.title}` : ''}
          </h1>
        </header>

        <Card className={styles.payCard}>
          {survey.questions.length === 0 ? (
            <Callout tone="info" title="Nothing to answer yet">
              This event has no survey configured.
            </Callout>
          ) : (
            <SurveyForm reference={reference} questions={survey.questions} answers={survey.answers} />
          )}
        </Card>
      </div>
    </div>
  );
}
