import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import type { AbstractSubmission } from '@/lib/api/types';
import { Badge, Callout, Card } from '@/components/ui';
import { timestamp } from '@/lib/format';
import { WithdrawButton } from './WithdrawButton';
import styles from '../../dashboard.module.css';

export const metadata: Metadata = { title: 'Your submission', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ reference: string }>;
type SearchParams = Promise<{ submitted?: string }>;

const EDITABLE = ['SUBMITTED', 'UNDER_REVIEW'];

export default async function AbstractDetailPage({
  params, searchParams,
}: { params: Params; searchParams: SearchParams }) {
  const { reference } = await params;
  const { submitted } = await searchParams;

  const user = await getSession();
  if (!user) redirect(`/login?next=/dashboard/abstracts/${reference}`);

  // The participant-facing routes key by numeric id, not the reference in
  // the URL — a reference is what someone reads and quotes, an id is what
  // the mutation endpoints take. The list is always small, so finding the
  // match here costs nothing and keeps the URL in the same shape every
  // other dashboard detail page uses.
  let submission: AbstractSubmission | undefined;
  try {
    const { data } = await apiAsUser<AbstractSubmission[]>('/summit/abstracts/mine');
    submission = (data ?? []).find((s) => s.reference === reference);
  } catch {
    submission = undefined;
  }
  if (!submission) notFound();

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <Link href="/dashboard/abstracts" className={styles.headLink}>
          <span aria-hidden="true">← </span>My submissions
        </Link>

        {submitted && (
          <Callout tone="success" title="Submission received">
            We will email you once a decision has been made.
          </Callout>
        )}

        <header className={styles.head}>
          <div>
            <div className={styles.regHead}>
              <Badge tone="neutral">{submission.status.replace('_', ' ')}</Badge>
              <span className={styles.reference}>{submission.reference}</span>
            </div>
            <h1 className={styles.title}>{submission.title}</h1>
            {submission.event && <p className={styles.regMeta}>{submission.event.title}</p>}
          </div>
        </header>

        <Card>
          <h2 className={styles.sectionTitle}>Abstract</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: 'var(--space-3)' }}>
            {submission.abstractText}
          </p>
        </Card>

        {submission.coAuthors.length > 0 && (
          <Card>
            <h2 className={styles.sectionTitle}>Co-authors</h2>
            <ul style={{ marginTop: 'var(--space-3)' }}>
              {submission.coAuthors.map((a) => <li key={a.name}>{a.name}</li>)}
            </ul>
          </Card>
        )}

        {EDITABLE.includes(submission.status) && (
          <Card>
            <h2 className={styles.sectionTitle}>Withdraw</h2>
            <p style={{ marginBottom: 'var(--space-3)' }}>
              Changed your mind, or submitting somewhere else instead? You can withdraw
              until a decision is made.
            </p>
            <WithdrawButton id={submission.id} reference={submission.reference} />
          </Card>
        )}

        {submission.decidedAt && (
          <p className={styles.regMeta}>Decided {timestamp(submission.decidedAt)}</p>
        )}
      </div>
    </div>
  );
}
