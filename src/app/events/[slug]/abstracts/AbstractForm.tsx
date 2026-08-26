'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Callout, Field, inputClass, textareaClass, selectClass } from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import type { EventTrack, SessionUser } from '@/lib/api/types';
import { submitAbstractAction } from './actions';
import { emptyAbstractState } from './state';
import styles from './abstracts.module.css';

/**
 * Submitting an abstract asks for far less than registering: no attendance
 * mode, no fee, no consent checkbox — just the proposal itself. Everyone
 * submitting is already signed in (the page above gates that), so name and
 * email come from the account, not this form.
 */
export function AbstractForm({
  eventId, slug, tracks, user,
}: {
  eventId: string; slug: string; tracks: EventTrack[]; user: SessionUser;
}) {
  const [state, formAction] = useActionState(submitAbstractAction, emptyAbstractState);
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="slug" value={slug} />

      {state.message && (
        <Callout tone="danger" title="Could not submit">{state.message}</Callout>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Submitting as</h2>
        <p>{user.fullName} · {user.email}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your proposal</h2>

        <Field label="Title" htmlFor="title" error={err('title')} required>
          <input id="title" name="title" className={inputClass} required maxLength={255} />
        </Field>

        <Field label="Abstract" htmlFor="abstractText" error={err('abstractText')} required
          hint="At least a few sentences describing the paper.">
          <textarea id="abstractText" name="abstractText" className={textareaClass} required
            minLength={20} maxLength={20000} style={{ minHeight: 180 }} />
        </Field>

        {tracks.length > 0 && (
          <Field label="Track" htmlFor="trackId" hint="Which track fits this proposal best, if you have a preference.">
            <select id="trackId" name="trackId" className={selectClass} defaultValue="">
              <option value="">No preference</option>
              {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Co-authors" htmlFor="coAuthors" hint="One name per line. Leave blank if you are the sole author.">
          <textarea id="coAuthors" name="coAuthors" className={textareaClass} style={{ minHeight: 80 }} />
        </Field>
      </section>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Submitting…">Submit abstract</SubmitButton>
        <Link href={`/events/${slug}`} className={styles.cancel}>Cancel</Link>
      </div>
    </form>
  );
}
