import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiRequestOrNull } from '@/lib/api/client';
import type { CertificateVerification } from '@/lib/api/types';
import { Badge, Card, Callout } from '@/components/ui';
import styles from './verify.module.css';

export const revalidate = 0;

type Params = Promise<{ code: string }>;

async function loadCertificate(code: string) {
  return apiRequestOrNull<CertificateVerification>(`/certificates/verify/${encodeURIComponent(code)}`);
}

export const metadata: Metadata = { title: 'Certificate verification', robots: { index: false } };

export default async function VerifyPage({ params }: { params: Params }) {
  const { code } = await params;
  const certificate = await loadCertificate(code);
  if (!certificate) notFound();

  const revoked = certificate.status === 'REVOKED';

  return (
    <div className="shell">
      <div className={styles.page}>
        <p className={styles.eyebrow}>Certificate verification</p>
        <h1 className={styles.title}>
          {certificate.valid ? 'This certificate is genuine' : 'This certificate is not valid'}
        </h1>

        {revoked && (
          <Callout tone="danger" title="Revoked">
            This certificate was withdrawn by CARISCA
            {certificate.revokedReason ? `: ${certificate.revokedReason}` : '.'}
          </Callout>
        )}

        <Card className={styles.card}>
          <div className={styles.row}>
            <Badge tone={certificate.valid ? 'success' : 'danger'}>
              {certificate.valid ? 'Issued by CARISCA' : certificate.status}
            </Badge>
          </div>

          <dl className={styles.details}>
            <div>
              <dt>Awarded to</dt>
              <dd>{certificate.participantName}</dd>
            </div>
            <div>
              <dt>Workshop</dt>
              <dd>{certificate.eventTitle}</dd>
            </div>
            {certificate.venue && (
              <div>
                <dt>Venue</dt>
                <dd>{certificate.venue}</dd>
              </div>
            )}
            <div>
              <dt>Date</dt>
              <dd>{certificate.dateLabel}</dd>
            </div>
            <div>
              <dt>Verification code</dt>
              <dd className={styles.code}>{certificate.verificationCode}</dd>
            </div>
          </dl>
        </Card>

        <p className={styles.footnote}>
          Issued by the Centre for Applied Research and Innovation in Supply Chain &ndash; Africa
          (CARISCA), KNUST School of Business.
        </p>
      </div>
    </div>
  );
}
