import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About CARISCA',
  description:
    "CARISCA supports higher education institutions in building the capacity to provide "
    + 'best-in-class degree programs and training, facilitate research translation and '
    + 'utilization, and engage stakeholders in practices and policy that strengthen supply chains.',
};

/**
 * Copy is CARISCA's own, from carisca.knust.edu.gh — the key objective from the
 * home page and the components from /what-we-do. Two small corrections are
 * noted in the commit; nothing else has been reworded.
 */
const COMPONENTS = [
  {
    number: '01',
    title: 'Research',
    goal:
      'To strengthen African higher education institutions’ capacity for and adoption of '
      + 'innovative, locally relevant research.',
  },
  {
    number: '02',
    title: 'Stakeholder Engagement',
    goal:
      'To create a strong network by engaging policymakers, the private sector, and civil '
      + 'society organizations in supply chain research, education, and knowledge transfer.',
  },
  {
    number: '03',
    title: 'Curricula & Training',
    goal:
      'To develop relevant evidence-based training opportunities to benefit students and '
      + 'supply chain management practitioners in Ghana and beyond.',
  },
];

export default function AboutPage() {
  return (
    <>
      <header className={styles.hero}>
        <div className="shell">
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>About us</p>
            <h1 className={styles.title}>
              Centre for Applied Research and Innovation in Supply Chain&#8209;Africa
            </h1>
            <p className={styles.lede}>
              CARISCA’s key objective is to support higher education institutions in building
              the capacity necessary to provide best-in-class degree programs and training,
              facilitate research translation and utilization and engage stakeholders in best
              practices and policy changes that strengthen supply chains.
            </p>
          </div>
        </div>
      </header>

      <div className="shell">
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What we do</h2>
          <div className={styles.prose}>
            <p>
              CARISCA divides its activities into components namely: research, stakeholder
              engagement and curriculum. These components push CARISCA closer to its aim to
              increase research capacity, strengthen and update supply chain curricula, and
              provide supply chain management expertise to Ghana and Africa.
            </p>
            <p>
              These activities also focus on developing partnerships and revenue-generating
              activities to sustain ongoing growth and influence in supply chain education,
              research and practice.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our three components</h2>
          {/* Numbered because CARISCA numbers them, not for decoration. */}
          <ol className={styles.components}>
            {COMPONENTS.map((c) => (
              <li key={c.number} className={styles.component}>
                <span className={styles.componentNumber} aria-hidden="true">{c.number}</span>
                <h3 className={styles.componentTitle}>{c.title}</h3>
                <p className={styles.componentGoal}>{c.goal}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>Continuing professional development</h2>
            <p className={styles.ctaText}>
              Short, practical courses for supply chain practitioners, researchers and
              students. Most award CPD credits and a certificate you can have verified.
            </p>
          </div>
          <ButtonLink href="/events" size="lg">Browse events</ButtonLink>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Find us</h2>
          <div className={styles.contact}>
            <div>
              <h3 className={styles.contactLabel}>Location</h3>
              <address className={styles.contactValue}>
                KNUST School of Business<br />
                Postgraduate Block E, Second Floor<br />
                PMB, Kumasi, Ghana
              </address>
            </div>
            <div>
              <h3 className={styles.contactLabel}>Email</h3>
              <p className={styles.contactValue}>
                <a href="mailto:info@carisca.knust.edu.gh">info@carisca.knust.edu.gh</a>
              </p>
            </div>
            <div>
              <h3 className={styles.contactLabel}>Phone</h3>
              <p className={styles.contactValue}>
                <a href="tel:+233244692953">024-469-2953</a>
              </p>
            </div>
            <div>
              <h3 className={styles.contactLabel}>Main site</h3>
              <p className={styles.contactValue}>
                <Link href="https://carisca.knust.edu.gh" target="_blank" rel="noreferrer">
                  carisca.knust.edu.gh
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
