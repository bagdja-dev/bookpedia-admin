'use client';

import { useSearchParams } from 'next/navigation';

import styles from '@/app/page.module.css';

export function AuthErrorNotice() {
  const error = useSearchParams().get('error');

  if (!error) return null;

  return (
    <p className={styles.authErrorNotice} role="alert">
      Login gagal ({error}). Silakan coba lagi.
    </p>
  );
}
