import { NextRequest, NextResponse } from 'next/server';

import { getApiBase } from '@/lib/api-base';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { token } = await getSession();
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const platformId = incoming.get('platformId');
  const file = incoming.get('file');
  if (typeof platformId !== 'string' || !platformId || !file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Platform dan file JKS wajib diisi' }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append('file', file, file instanceof File ? file.name : 'keystore.jks');
  for (const field of ['name', 'alias', 'storePassword', 'keyPassword']) {
    const value = incoming.get(field);
    if (typeof value === 'string') outgoing.append(field, value);
  }

  try {
    const response = await fetch(
      `${getApiBase()}/platform-builds/platforms/${encodeURIComponent(platformId)}/keystore-profiles`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: outgoing,
      },
    );
    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || response.statusText };
    }
    if (!response.ok) {
      const error = data as { message?: string; error?: string };
      return NextResponse.json(
        { error: error.message ?? error.error ?? 'Upload keystore gagal' },
        { status: response.status },
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload keystore gagal' },
      { status: 502 },
    );
  }
}