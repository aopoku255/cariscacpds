import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, apiAsUser } from '@/lib/auth/session';
import type { AbstractSubmission } from '@/lib/api/types';
import { Badge, EmptyState, ButtonLink } from '@/components/ui';
import { timestamp } from '@/lib/format';
import styles from '../dashboard.module.css';

export const metadata: Metadata = { title: 'My abstract submissions', robots: { index: false } };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<AbstractSubmission['status'], string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Not accepted',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_TONE: Record<AbstractSubmission['status'], 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  SUBMITTED: 'neutral',
  UNDER_REVIEW: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'warning',
};

function SubmissionRow({ submission }: { submission: AbstractSubmission }) {
  return (
    <li className={styles.regRow}>
      <div className={styles.regMain}>
        <div className={styles.regHead}>
          <Badge tone={STATUS_TONE[submission.status]}>{STATUS_LABEL[submission.status]}</Badge>
          <span className={styles.reference}>{submission.reference}</span>
        </div>

        <h3 className={styles.regTitle}>
          <Link href={`/dashboard/abstracts/${submission.reference}`}>{submission.title}</Link>
        </h3>

        {submission.event && (
          <p className={styles.regMeta}>{submission.event.title} · submitted {timestamp(submission.submittedAt)}</p>
        )}
      </div>

      <div className={styles.regAction}>
        <Link href={`/dashboard/abstracts/${submission.reference}`} className={styles.regLink}>
          View<span aria-hidden="true"> →</span>
        </Link>
      </div>
    </li>
  );
}

export default async function MyAbstractsPage() {
  const user = await getSession();
  if (!user) redirect('/login?next=/dashboard/abstracts');

  let submissions: AbstractSubmission[] = [];
  try {
    const { data } = await apiAsUser<AbstractSubmission[]>('/summit/abstracts/mine');
    submissions = data ?? [];
  } catch {
    submissions = [];
  }

  return (
    <div className="shell">
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <Link href="/dashboard" className={styles.headLink}>
              <span aria-hidden="true">← </span>My account
            </Link>
            <h1 className={styles.title}>My abstract submissions</h1>
          </div>
        </header>

        {submissions.length > 0 ? (
          <section className={styles.section}>
            <ul className={styles.regList}>
              {submissions.map((s) => <SubmissionRow key={s.id} submission={s} />)}
            </ul>
          </section>
        ) : (
          <EmptyState
            title="Nothing submitted yet"
            description="When you submit an abstract to a Summit, it will appear here with its review status."
            action={<ButtonLink href="/events">Browse events</ButtonLink>}
          />
        )}
      </div>
    </div>
  );
}
