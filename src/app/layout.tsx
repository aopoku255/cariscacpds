import type { Metadata } from 'next';
import { Barlow, Arimo } from 'next/font/google';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Staff need a way to reach the console. Without this the only route in is
  // typing /admin, which nobody discovers.
  const user = await getSession().catch(() => null);

  return (
    <html lang="en" className={`${barlow.variable} ${arimo.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>

        <header className={styles.header}>
          <div className={`shell ${styles.headerInner}`}>
            <Link href="/" className={styles.brand}>
              {/*
                The official lockup. On narrow screens it is cropped to the
                CARISCA wordmark rather than scaled whole — at phone width the
                descriptor line would be about five pixels tall and unreadable.
                eslint-disable-next-line @next/next/no-img-element
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/carisca-logo.png"
                alt="CARISCA — Centre for Applied Research and Innovation in Supply Chain-Africa"
                className={styles.logo}
                width={2123}
                height={159}
              />
            </Link>

            <nav className={styles.nav} aria-label="Main">
              <Link href="/events">Events</Link>
              <Link href="/verify">Verify a certificate</Link>
              {/* The console is a separate application; link out to it. */}
              {user?.isStaff && (
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'}
                  className={styles.navStaff}
                >
                  Admin
                </a>
              )}
              <Link href="/dashboard" className={styles.navCta}>
                {user ? 'My account' : 'Sign in'}
              </Link>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className={styles.footer}>
          <div className={`shell ${styles.footerInner}`}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/carisca-logo.png"
                alt="CARISCA — Centre for Applied Research and Innovation in Supply Chain-Africa"
                className={styles.footerLogo}
                width={2123}
                height={159}
              />
              <p className={styles.footerTagline}>Strong Supply Chains — Strong Communities</p>
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
