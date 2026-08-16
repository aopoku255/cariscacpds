'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  Callout, Field, inputClass, selectClass, checkRowClass,
} from '@/components/ui';
import { SubmitButton } from '@/components/forms/SubmitButton';
import type { ReferenceData, UserProfile } from '@/lib/api/types';
import { emptyState } from '@/lib/auth/form-state';
import { updateProfileAction } from './actions';
import styles from './profile.module.css';

/**
 * The participant's own details.
 *
 * These are what appear on a certificate, so the name fields are grouped and
 * labelled in those terms rather than as an anonymous form — someone correcting
 * a misspelling before an event needs to see why it matters.
 */
export function ProfileForm({
  profile, reference, next,
}: {
  profile: UserProfile;
  reference: ReferenceData;
  next: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, emptyState);
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className={styles.form} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.message && (
        <Callout
          tone={state.ok ? 'success' : 'danger'}
          title={state.ok ? undefined : 'We could not save your details'}
        >
          {state.message}
        </Callout>
      )}

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>Your name</legend>
        <p className={styles.groupNote}>
          Exactly as it should appear on your certificate.
        </p>

        <div className={styles.nameRow}>
          <Field label="Title" htmlFor="prefix" error={err('prefix')}>
            <select id="prefix" name="prefix" className={selectClass}
              defaultValue={profile.prefix ?? ''}>
              <option value="">—</option>
              {reference.prefixes.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="First name" htmlFor="firstName" error={err('firstName')} required>
            <input id="firstName" name="firstName" className={inputClass}
              autoComplete="given-name" defaultValue={profile.firstName} maxLength={80} required />
          </Field>
        </div>

        <div className={styles.pair}>
          <Field label="Middle name" htmlFor="middleName" error={err('middleName')}>
            <input id="middleName" name="middleName" className={inputClass}
              autoComplete="additional-name" defaultValue={profile.middleName ?? ''} maxLength={80} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={err('lastName')} required>
            <input id="lastName" name="lastName" className={inputClass}
              autoComplete="family-name" defaultValue={profile.lastName} maxLength={80} required />
          </Field>
        </div>

        <div className={styles.pair}>
          {/* No hint here: the options say what it is, and a hint on one half
              of a pair pushes its control out of line with the other. */}
          <Field label="Suffix" htmlFor="suffix" error={err('suffix')}>
            <select id="suffix" name="suffix" className={selectClass}
              defaultValue={profile.suffix ?? ''}>
              <option value="">—</option>
              {reference.suffixes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Gender" htmlFor="gender" error={err('gender')}>
            <select id="gender" name="gender" className={selectClass}
              defaultValue={profile.gender ?? ''}>
              <option value="">Prefer not to say</option>
              {reference.genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>How we reach you</legend>

        <div className={styles.readonly}>
          <span className={styles.readonlyLabel}>Email address</span>
          <span className={styles.readonlyValue}>{profile.email}</span>
          <span className={styles.groupNote}>
            Your confirmations, QR codes and certificates go here. Contact us if
            it needs changing — a new address has to be verified.
          </span>
        </div>

        <Field label="Phone" htmlFor="phone" error={err('phone')}
          hint="Optional. Used only if we need to reach you about an event.">
          <input id="phone" name="phone" type="tel" className={inputClass}
            autoComplete="tel" defaultValue={profile.phone ?? ''} maxLength={32} />
        </Field>

        <label className={checkRowClass}>
          <input type="checkbox" name="emailOptOut" defaultChecked={profile.emailOptOut} />
          <span>
            Do not send me announcements about new events
            <span className={styles.groupNote} style={{ display: 'block' }}>
              You will still get everything about events you have registered for.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>Your work</legend>

        <div className={styles.pair}>
          <Field label="Organization" htmlFor="organization" error={err('organization')}>
            <input id="organization" name="organization" className={inputClass}
              autoComplete="organization" defaultValue={profile.organization ?? ''} maxLength={160} />
          </Field>
          <Field label="Job title" htmlFor="jobTitle" error={err('jobTitle')}>
            <input id="jobTitle" name="jobTitle" className={inputClass}
              autoComplete="organization-title" defaultValue={profile.jobTitle ?? ''} maxLength={160} />
          </Field>
        </div>

        <div className={styles.pair}>
          <Field label="Position" htmlFor="positionKey" error={err('positionKey')}>
            <select id="positionKey" name="positionKey" className={selectClass}
              defaultValue={profile.position?.key ?? ''}>
              <option value="">Not set</option>
              {reference.positions.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sector" htmlFor="sectorKey" error={err('sectorKey')}>
            <select id="sectorKey" name="sectorKey" className={selectClass}
              defaultValue={profile.sector?.key ?? ''}>
              <option value="">Not set</option>
              {reference.sectors.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>Where you are</legend>
        <p className={styles.groupNote}>
          Some events are priced differently by region, so this affects the fee
          you are quoted.
        </p>

        <Field label="Country" htmlFor="countryCode" error={err('countryCode')}>
          <select id="countryCode" name="countryCode" className={selectClass}
            defaultValue={profile.countryCode ?? ''}>
            <option value="">Not set</option>
            {reference.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>

        <div className={styles.pair}>
          <Field label="City" htmlFor="city" error={err('city')}>
            <input id="city" name="city" className={inputClass}
              autoComplete="address-level2" defaultValue={profile.city ?? ''} maxLength={120} />
          </Field>
          <Field label="State or province" htmlFor="stateProvince" error={err('stateProvince')}>
            <input id="stateProvince" name="stateProvince" className={inputClass}
              autoComplete="address-level1" defaultValue={profile.stateProvince ?? ''} maxLength={120} />
          </Field>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">
          {next ? 'Save and continue' : 'Save changes'}
        </SubmitButton>
        <Link href={next ?? '/dashboard'}>Cancel</Link>
      </div>
    </form>
  );
}
