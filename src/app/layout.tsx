import type { Metadata } from 'next';
import { Barlow, Arimo } from 'next/font/google';
import Link from 'next/link';
import '@/styles/globals.css';
import styles from './layout.module.css';

/**
 * The typefaces the CARISCA site already uses. Served by next/font, which
 * self-hosts them at build time — no request to Google on page load, and no
 * layout shift from a late-arriving webfont.
 */
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-arimo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CARISCA — Events & Professional Development',
    template: '%s · CARISCA',
  },
  description:
    'Continuing professional development, the CARISCA Summit and Business Forum from the '
    + 'Centre for Applied Research and Innovation in Supply Chain-Africa at KNUST.',
  openGraph: {
    siteName: 'CARISCA',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${arimo.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>

        <header className={styles.header}>
          <div className={`shell ${styles.headerInner}`}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>CARISCA</span>
              <span className={styles.brandTag}>Strong Supply Chains — Strong Communities</span>
            </Link>

            <nav className={styles.nav} aria-label="Main">
              <Link href="/events">Events</Link>
              <Link href="/verify">Verify a certificate</Link>
              <Link href="/dashboard" className={styles.navCta}>My account</Link>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className={styles.footer}>
          <div className={`shell ${styles.footerInner}`}>
            <div>
              <p className={styles.footerName}>
                Centre for Applied Research and Innovation in Supply Chain&#8209;Africa
              </p>
              <p className={styles.footerMeta}>
                KNUST School of Business, College of Humanities &amp; Social Sciences<br />
                PMB, Kumasi, Ghana
              </p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/events">Events</Link>
              <Link href="/verify">Verify a certificate</Link>
              <a href="mailto:info@carisca.knust.edu.gh">info@carisca.knust.edu.gh</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
