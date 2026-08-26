import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { apiRequestOrNull } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import type { PublicEvent } from '@/lib/api/types';
import { Callout, ButtonLink } from '@/components/ui';
import { AbstractForm } from './AbstractForm';
import styles from './abstracts.module.css';

export const metadata: Metadata = { title: 'Submit an abstract', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export default async function SubmitAbstractPage({ params }: { params: Params }) {
  const { slug } = await params;

  const event = await apiRequestOrNull<PublicEvent>(`/events/${encodeURIComponent(slug)}`);
  if (!event) notFound();
  if (event.type?.key !== 'summit') notFound();

  const user = await getSession();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/events/${slug}/abstracts`)}`);
  }

  const now = Date.now();
  const opensAt = event.summit?.callForPapersOpensAt ? new Date(event.summit.callForPapersOpensAt).getTime() : null;
  const closesAt = event.summit?.callForPapersClosesAt ? new Date(event.summit.callForPapersClosesAt).getTime() : null;
  const notYetOpen = opensAt !== null && opensAt > now;
  const closed = closesAt !== null && closesAt <= now;

  if (notYetOpen || closed) {
    return (
      <div className="shell shell--narrow">
        <div className={styles.page}>
          <Callout tone="info" title={closed ? 'The call for papers has closed' : 'Not open yet'}>
            <p>
              {closed
                ? 'This event is no longer accepting abstract submissions.'
                : 'Submissions for this event have not opened yet. Check back closer to the opening date.'}
            </p>
          </Callout>
          <ButtonLink href={`/events/${event.slug}`} variant="secondary">Back to the event</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <Link href={`/events/${event.slug}`} className={styles.back}>
            <span aria-hidden="true">← </span>{event.title}
          </Link>
          <h1 className={styles.title}>Submit an abstract</h1>
          {event.summit?.theme && <p className={styles.when}>Theme: {event.summit.theme}</p>}
        </header>

        <AbstractForm eventId={event.id} slug={event.slug} tracks={event.tracks ?? []} user={user} />
      </div>
    </div>
  );
}
