import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiRequestOrNull } from '@/lib/api/client';
import type { PublicEvent, EventPrice, EventSession } from '@/lib/api/types';
import { Badge, Callout, ButtonLink, Card } from '@/components/ui';
import {
  eventDateRange, eventTime, timezoneLabel, deliveryLabel, money, eventStatusLabel,
} from '@/lib/format';
import { assetUrl } from '@/lib/api/assets';
import styles from './event.module.css';

// See events/page.tsx for why this is dynamic rather than time-revalidated.
export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

async function loadEvent(slug: string) {
  return apiRequestOrNull<PublicEvent>(`/events/${encodeURIComponent(slug)}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) return { title: 'Event not found' };

  return {
    title: event.title,
    description: event.shortDescription ?? undefined,
    openGraph: {
      title: event.title,
      description: event.shortDescription ?? undefined,
      type: 'article',
      // So a link shared on WhatsApp or LinkedIn previews with the banner.
      images: event.banner ? [assetUrl(event.banner.url)!] : undefined,
    },
  };
}

const AUDIENCE_LABEL: Record<EventPrice['audience'], string> = {
  ANY: 'Everyone',
  HOST_COUNTRY: 'Local participants',
  AFRICA: 'Participants in Africa',
  INTERNATIONAL: 'Participants outside Africa',
};

/** Participant-facing wording; the enum is for the database. */
const PARTNER_ROLE: Record<NonNullable<PublicEvent['partners']>[number]['role'], string> = {
  PARTNER: 'Partner',
  HOST: 'Host',
  SPONSOR: 'Sponsor',
  FUNDER: 'Funder',
  ACCREDITOR: 'Accredited by',
  SUPPORTER: 'Supporter',
};

const MODE_LABEL: Record<EventPrice['attendanceMode'], string> = {
  ANY: 'Any',
  IN_PERSON: 'In person',
  VIRTUAL: 'Online',
};

/**
 * The fee table is shown in full rather than as a single "from" figure.
 * CARISCA prices by attendance type and region, and a participant should be
 * able to find their own row before they start filling anything in.
 */
function FeeTable({ prices }: { prices: EventPrice[] }) {
  const byCurrency = prices.reduce<Record<string, EventPrice[]>>((acc, p) => {
    (acc[p.money.currency] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className={styles.fees}>
      {Object.entries(byCurrency).map(([currency, rows]) => (
        <div key={currency} className={styles.feeGroup}>
          {Object.keys(byCurrency).length > 1 && (
            <h3 className={styles.feeCurrency}>Paying in {currency}</h3>
          )}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Rate</th>
                  <th scope="col">Attending</th>
                  <th scope="col">Who</th>
                  <th scope="col" className={styles.numeric}>Fee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">{p.label}</th>
                    <td>{MODE_LABEL[p.attendanceMode]}</td>
                    <td>{AUDIENCE_LABEL[p.audience]}</td>
                    <td className={styles.numeric}>
                      {p.money.amountMinor === 0 ? 'Free' : money(p.money)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className={styles.feeNote}>
        The exact fee for you is confirmed before you pay. It depends on how you attend
        and where you are based.
      </p>
    </div>
  );
}

function PartnerGrid({ partners }: { partners: NonNullable<PublicEvent['partners']> }) {
  return (
    <ul className={styles.partners}>
      {partners.map((partner) => {
        const logo = assetUrl(partner.logo?.url);
        const inner = (
          <>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={partner.name} className={styles.partnerLogo} loading="lazy" />
            ) : (
              <span className={styles.partnerName}>{partner.name}</span>
            )}
            <span className={styles.partnerRole}>{PARTNER_ROLE[partner.role]}</span>
          </>
        );

        return (
          <li key={partner.id} className={styles.partner}>
            {partner.websiteUrl ? (
              <a href={partner.websiteUrl} target="_blank" rel="noreferrer noopener"
                className={styles.partnerLink} title={partner.name}>
                {inner}
              </a>
            ) : inner}
          </li>
        );
      })}
    </ul>
  );
}

function SessionRow({ session, timezone }: { session: EventSession; timezone: string }) {
  return (
    <li>
      <div className={styles.agendaTime}>
        <time dateTime={session.startAt}>{eventTime(session.startAt, timezone)}</time>
        <span aria-hidden="true">–</span>
        <time dateTime={session.endAt}>{eventTime(session.endAt, timezone)}</time>
      </div>
      <div>
        <h3 className={styles.agendaTitle}>{session.title}</h3>
        {session.description && <p className={styles.agendaText}>{session.description}</p>}
        {session.location && <p className={styles.agendaWhere}>{session.location}</p>}
      </div>
    </li>
  );
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();

  const isOpen = event.status === 'REGISTRATION_OPEN';
  const cancelled = event.status === 'CANCELLED';
  const inPersonFull = event.availability?.inPerson?.isFull ?? false;
  const virtualFull = event.availability?.virtual?.isFull ?? false;
  const everythingFull =
    (event.deliveryMode === 'OFFLINE' && inPersonFull)
    || (event.deliveryMode === 'ONLINE' && virtualFull)
    || (event.deliveryMode === 'HYBRID' && inPersonFull && virtualFull);

  // A call for papers with no dates set stays open indefinitely — only an
  // explicit closing date in the past shuts it, matching the API's own rule.
  const now = Date.now();
  const cfpOpensAt = event.summit?.callForPapersOpensAt ? new Date(event.summit.callForPapersOpensAt).getTime() : null;
  const cfpClosesAt = event.summit?.callForPapersClosesAt ? new Date(event.summit.callForPapersClosesAt).getTime() : null;
  const callForPapersOpen = event.type?.key === 'summit'
    && (cfpOpensAt === null || cfpOpensAt <= now)
    && (cfpClosesAt === null || cfpClosesAt > now);

  const banner = assetUrl(event.banner?.url);

  return (
    <article>
      {banner && (
        <div className={styles.bannerWrap}>
          {/* Decorative: the title immediately below carries the meaning. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className={styles.bannerImage} />
        </div>
      )}
      <header className={styles.hero}>
        <div className="shell">
          <div className={styles.heroInner}>
            <div className={styles.heroMain}>
            <div className={styles.badges}>
              {event.type && <Badge tone="accent">{event.type.name}</Badge>}
              {cancelled
                ? <Badge tone="danger">Cancelled</Badge>
                : isOpen && !everythingFull
                  ? <Badge tone="success">Open for registration</Badge>
                  : <Badge tone="neutral">{eventStatusLabel[event.status] ?? event.status}</Badge>}
              {event.issuesCertificate && <Badge tone="info">Certificate awarded</Badge>}
            </div>

            <h1 className={styles.title}>{event.title}</h1>
            {event.shortDescription && <p className={styles.lede}>{event.shortDescription}</p>}
            </div>

            <aside className={styles.heroAside}>
            <dl className={styles.facts}>
              <div>
                <dt>Dates</dt>
                <dd>
                  {eventDateRange(event.startAt, event.endAt, event.timezone)}
                  <span className={styles.time}>
                    {' '}{eventTime(event.startAt, event.timezone)}–{eventTime(event.endAt, event.timezone)}
                    {' '}{timezoneLabel(event.startAt, event.timezone)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{deliveryLabel[event.deliveryMode]}</dd>
              </div>
              {(event.location.venue || event.location.city) && (
                <div>
                  <dt>Venue</dt>
                  <dd>
                    {event.location.venue}
                    {event.location.city ? `, ${event.location.city}` : ''}
                    {event.location.country ? `, ${event.location.country}` : ''}
                  </dd>
                </div>
              )}
              {event.cpd?.credits ? (
                <div>
                  <dt>CPD credits</dt>
                  <dd>
                    {event.cpd.credits}
                    {event.cpd.accreditingBody ? ` · ${event.cpd.accreditingBody}` : ''}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className={styles.cta}>
              {cancelled && (
                <Callout tone="danger" title="This event has been cancelled">
                  If you had registered and paid, a refund is on its way to your original
                  payment method.
                </Callout>
              )}

              {!cancelled && isOpen && !everythingFull && (
                <ButtonLink href={`/events/${event.slug}/register`} size="lg">
                  Register for this event
                </ButtonLink>
              )}

              {!cancelled && isOpen && everythingFull && (
                <Callout tone="warning" title="This event is fully booked">
                  You can still join the waitlist and we will email you if a place opens up.
                  {' '}
                  <Link href={`/events/${event.slug}/register`}>Join the waitlist</Link>.
                </Callout>
              )}

              {!cancelled && event.status === 'PUBLISHED' && (
                <Callout tone="info" title="Registration is not open yet">
                  {event.registrationOpensAt
                    ? `Registration opens on ${eventDateRange(event.registrationOpensAt, event.registrationOpensAt, event.timezone)}.`
                    : 'Check back shortly. Registration opens soon.'}
                </Callout>
              )}

              {!cancelled && event.status === 'REGISTRATION_CLOSED' && (
                <Callout tone="neutral" title="Registration has closed">
                  Contact us if you believe you should still be able to attend.
                </Callout>
              )}

              {!cancelled && callForPapersOpen && (
                <ButtonLink href={`/events/${event.slug}/abstracts`} variant="secondary">
                  Submit an abstract
                </ButtonLink>
              )}
            </div>
            </aside>
          </div>
        </div>
      </header>

      <div className={`shell ${styles.body}`}>
        <div className={styles.main}>
          {event.description && (
            <section className={styles.section}>
              <h2>About this programme</h2>
              <div className={styles.prose}>
                {event.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {event.cpd?.learningObjectives?.length ? (
            <section className={styles.section}>
              <h2>What you will learn</h2>
              <ul className={styles.ticks}>
                {event.cpd.learningObjectives.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </section>
          ) : null}

          {event.cpd?.targetAudience?.length ? (
            <section className={styles.section}>
              <h2>Who it is for</h2>
              <ul className={styles.ticks}>
                {event.cpd.targetAudience.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          ) : null}

          {event.sessions?.length ? (
            <section className={styles.section}>
              <h2>Programme</h2>
              {event.tracks?.length ? (
                // Grouped by track — a Summit's parallel streams. Any session
                // left untagged still shows, under its own "General" heading,
                // rather than silently vanishing from the agenda.
                (() => {
                  const byTrack = new Map(event.tracks.map((t) => [t.id, { track: t, sessions: [] as EventSession[] }]));
                  const untracked: EventSession[] = [];
                  for (const s of event.sessions) {
                    const bucket = s.trackId ? byTrack.get(s.trackId) : undefined;
                    if (bucket) bucket.sessions.push(s); else untracked.push(s);
                  }
                  const groups = [...byTrack.values()].filter((g) => g.sessions.length > 0);
                  return (
                    <>
                      {groups.map(({ track, sessions }) => (
                        <div key={track.id} className={styles.trackGroup}>
                          <h3 className={styles.trackHeading}>
                            <span className={styles.trackSwatch} style={track.color ? { background: track.color } : undefined} aria-hidden="true" />
                            {track.name}
                          </h3>
                          {track.description && <p className={styles.trackDescription}>{track.description}</p>}
                          <ol className={styles.agenda}>
                            {sessions.map((s) => <SessionRow key={s.id} session={s} timezone={event.timezone} />)}
                          </ol>
                        </div>
                      ))}
                      {untracked.length > 0 && (
                        <div className={styles.trackGroup}>
                          {groups.length > 0 && <h3 className={styles.trackHeading}>General</h3>}
                          <ol className={styles.agenda}>
                            {untracked.map((s) => <SessionRow key={s.id} session={s} timezone={event.timezone} />)}
                          </ol>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <ol className={styles.agenda}>
                  {event.sessions.map((s) => <SessionRow key={s.id} session={s} timezone={event.timezone} />)}
                </ol>
              )}
            </section>
          ) : null}

          {event.speakers?.length ? (
            <section className={styles.section}>
              <h2>Facilitators and speakers</h2>
              <ul className={styles.speakers}>
                {event.speakers.map((s) => (
                  <li key={s.id} className={styles.speakerCard}>
                    {s.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(s.photo.url) ?? undefined} alt=""
                        className={styles.speakerPhoto} />
                    )}
                    <div>
                      <h3 className={styles.speakerName}>{s.name}</h3>
                      {(s.title || s.organization) && (
                        <p className={styles.speakerRole}>
                          {[s.title, s.organization].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {s.bio && <p className={styles.speakerBio}>{s.bio}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {event.partners && event.partners.length > 0 && (() => {
            const tiers = event.sponsorshipTiers ?? [];
            const tierById = new Map(tiers.map((t) => [t.id, t]));
            const tiered = tiers.length
              ? event.partners.filter((p) => p.sponsorshipTierId && tierById.has(p.sponsorshipTierId))
              : [];
            const untiered = tiers.length
              ? event.partners.filter((p) => !(p.sponsorshipTierId && tierById.has(p.sponsorshipTierId)))
              : event.partners;

            return (
              <>
                {tiers.length > 0 && tiered.length > 0 && (
                  <section className={styles.section}>
                    <h2>Sponsors</h2>
                    {tiers.map((tier) => {
                      const sponsors = tiered.filter((p) => p.sponsorshipTierId === tier.id);
                      if (sponsors.length === 0) return null;
                      return (
                        <div key={tier.id} className={styles.tierGroup}>
                          <h3 className={styles.tierHeading}>{tier.name}</h3>
                          <PartnerGrid partners={sponsors} />
                        </div>
                      );
                    })}
                  </section>
                )}

                {untiered.length > 0 && (
                  <section className={styles.section}>
                    <h2>In partnership with</h2>
                    <PartnerGrid partners={untiered} />
                  </section>
                )}
              </>
            );
          })()}

          {event.cpd?.requirements && (
            <section className={styles.section}>
              <h2>What you need</h2>
              <div className={styles.prose}><p>{event.cpd.requirements}</p></div>
            </section>
          )}
        </div>

        <aside className={styles.aside}>
          {event.prices?.length ? (
            <Card>
              <h2 className={styles.asideTitle}>Fees</h2>
              <FeeTable prices={event.prices} />
            </Card>
          ) : null}

          {event.issuesCertificate && (
            <Card>
              <h2 className={styles.asideTitle}>Your certificate</h2>
              <p className={styles.asideText}>
                {event.cpd?.credits
                  ? `Completing this course earns ${event.cpd.credits} CPD credits and a certificate you can share and have verified online.`
                  : 'You will receive a certificate you can share and have verified online.'}
              </p>
              {/* Stating the condition up front. Promising a certificate and
                  only revealing the attendance bar afterwards is a complaint
                  waiting to happen. */}
              {event.attendance?.minPercent ? (
                <p className={styles.asideNote}>
                  You need to attend at least {event.attendance.minPercent}% of sessions to qualify.
                </p>
              ) : (
                <p className={styles.asideNote}>You need to check in at the event to qualify.</p>
              )}
            </Card>
          )}

          {(event.contact.email || event.contact.phone) && (
            <Card>
              <h2 className={styles.asideTitle}>Questions?</h2>
              <ul className={styles.contact}>
                {event.contact.email && (
                  <li><a href={`mailto:${event.contact.email}`}>{event.contact.email}</a></li>
                )}
                {event.contact.phone && (
                  <li><a href={`tel:${event.contact.phone}`}>{event.contact.phone}</a></li>
                )}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </article>
  );
}
