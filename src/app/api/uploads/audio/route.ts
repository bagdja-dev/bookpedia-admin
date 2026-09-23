/**
 * Route BFF untuk upload suara notifikasi Platform — pola PERSIS
 * `app/api/uploads/image/route.ts` (route terpisah, bukan lewat proxy
 * generik, karena proxy generik pakai `request.text()` yang merusak
 * `multipart/form-data` biner), cuma forward ke `POST /uploads/audio`.
 */
import { NextRequest, NextResponse } from 'next/server';

import { getApiBase } from '@/lib/api-base';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { token } = await getSession();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = incoming.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
  }

  const outgoing = new FormData();
  const filename = file instanceof File ? file.name : 'audio.bin';
  outgoing.append('file', file, filename);

  const folder = incoming.get('folder');
  if (folder && typeof folder === 'string') {
    outgoing.append('folder', folder);
  }

  try {
    const res = await fetch(`${getApiBase()}/uploads/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || res.statusText };
    }

    if (!res.ok) {
      const err = data as { message?: string; error?: string };
      return NextResponse.json(
        { error: err.message ?? err.error ?? 'Upload failed' },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
