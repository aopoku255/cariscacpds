import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, refreshSession } from '@/lib/auth/session';

/**
 * The one place a certificate download passes through. The tokens that
 * authorise it live in httpOnly cookies the browser never sees, so a plain
 * `<a href>` straight to the API can't carry them — this route reads the
 * cookie server-side, attaches it, and streams the API's response back
 * unchanged rather than buffering a multi-hundred-KB file in memory.
 */

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';

type Params = Promise<{ reference: string }>;

function fetchCertificate(reference: string, format: string, token: string) {
  return fetch(
    `${API_BASE}/registrations/${encodeURIComponent(reference)}/certificate?format=${format}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { reference } = await params;
  const loginUrl = new URL(`/login?next=/dashboard/registrations/${reference}`, request.url);
  const format = request.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'pdf';

  const token = await getAccessToken();
  if (!token) return NextResponse.redirect(loginUrl);

  let upstream = await fetchCertificate(reference, format, token);
  if (upstream.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) return NextResponse.redirect(loginUrl);
    upstream = await fetchCertificate(reference, format, refreshed.accessToken);
  }

  if (!upstream.ok) {
    const body = await upstream.json().catch(() => null);
    const message = body?.message || 'Could not generate your certificate.';
    const errorUrl = new URL(`/dashboard/registrations/${reference}`, request.url);
    errorUrl.searchParams.set('certificateError', message);
    return NextResponse.redirect(errorUrl);
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': upstream.headers.get('content-disposition') ?? 'attachment',
    },
  });
}
