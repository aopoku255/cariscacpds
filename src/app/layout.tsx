import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Arimo } from 'next/font/google';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { SiteNav, type NavLink } from '@/components/SiteNav';
import { RouteProgress } from '@/components/RouteProgress';
import '@/styles/globals.css';
import styles from './layout.module.css';

/**
 * Arimo throughout, matching CARISCA's own site, which sets it on
 * `body, input, button, select, textarea` and on headings alike. Self-hosted
 * by next/font, so nothing is requested from Google at page load and there is
 * no layout shift when it arrives.
 */
const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CARISCA: Events and Professional Development',
    template: '%s · CARISCA',
  },
  description:
    'Continuing professional development, the CARISCA Summit and Business Forum from the '
    + 'Centre for Applied Research and Innovation in Supply Chain-Africa at KNUST.',
  openGraph: { siteName: 'CARISCA', type: 'website' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession().catch(() => null);

  // Certificate verification and the admin console are deliberately absent.
  // Verification is reached from the link printed on a certificate, by the
  // people who hold one; the console has its own address that staff know.
  // Neither belongs in a public nav aimed at people looking for events.
  const links: NavLink[] = [
    { href: '/about', label: 'About' },
    { href: '/events', label: 'Events' },
    { href: '/dashboard', label: user ? 'My account' : 'Sign in', emphasis: true },
  ];

  return (
    <html lang="en" className={arimo.variable}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>

        <header className={styles.header}>
          <div className={`shell ${styles.headerInner}`}>
            <Link href="/" className={styles.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/carisca-logo.png"
                alt="CARISCA, Centre for Applied Research and Innovation in Supply Chain-Africa"
                className={styles.logo}
                width={2123}
                height={159}
              />
            </Link>

            <SiteNav links={links} />
          </div>

          {/*
            Inside the header so it anchors to it — .header is sticky, which
            makes it the containing block for an absolutely positioned child.
            Suspense because RouteProgress reads useSearchParams: without a
            boundary that would opt every page out of static rendering.
          */}
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
        </header>

        <main id="main">{children}</main>

        {/*
          The institutions behind CARISCA, on their own light band above the
          footer. Third-party marks are never reversed or recoloured — they get
          a light ground and room of their own.
        */}
        <section className={styles.institutions} aria-labelledby="institutions-heading">
          <div className="shell">
            
            <div className={styles.institutionLogos}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/knust.svg"
                alt="Kwame Nkrumah University of Science and Technology"
                className={styles.institutionLogo}
                width={125}
                height={58}
                loading="lazy"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kuhne.svg"
                alt="Learn Logistics by Kühne Foundation"
                className={styles.institutionLogo}
                width={774}
                height={322}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={`shell ${styles.footerInner}`}>
            <div className={styles.footerBrand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/carisca-logo.png"
                alt=""
                className={styles.footerLogo}
                width={2123}
                height={159}
                loading="lazy"
              />
              <p className={styles.footerTagline}>Strong Supply Chains, Strong Communities.</p>
              <address className={styles.footerMeta}>
                KNUST School of Business<br />
                College of Humanities &amp; Social Sciences<br />
                PMB, Kumasi, Ghana
              </address>
            </div>

            <nav className={styles.footerLinks} aria-label="Footer">
              <h2 className={styles.footerHeading}>Explore</h2>
              <Link href="/about">About CARISCA</Link>
              <Link href="/events">Events</Link>
              <Link href="/events?when=past">Past events</Link>
              <Link href="/dashboard">My account</Link>
            </nav>

            <div className={styles.footerLinks}>
              <h2 className={styles.footerHeading}>Contact</h2>
              <a href="mailto:info@carisca.knust.edu.gh">info@carisca.knust.edu.gh</a>
              <a href="https://carisca.knust.edu.gh" target="_blank" rel="noreferrer">
                carisca.knust.edu.gh
              </a>
            </div>
          </div>

          <div className={`shell ${styles.footerBottom}`}>
            <p>© {new Date().getFullYear()} CARISCA, KNUST. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
