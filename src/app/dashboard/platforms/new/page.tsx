'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACTIVE_PLATFORM_STORAGE_KEY, usePlatformContext } from '@/context/platform-context';
import { apiClient, slugify } from '@/lib/api-client';
import type { Platform, PlatformOwnerOrganization } from '@/lib/types';

type WizardStep = 'organization' | 'platform';

export default function CreatePlatformWizardPage() {
  const router = useRouter();
  const { refresh } = usePlatformContext();
  const [step, setStep] = useState<WizardStep>('organization');
  const [ownedOrganizations, setOwnedOrganizations] = useState<PlatformOwnerOrganization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [organizationLoadError, setOrganizationLoadError] = useState<string | null>(null);
  const [showCreateOrganization, setShowCreateOrganization] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [createdOrganization, setCreatedOrganization] = useState<PlatformOwnerOrganization | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [organizationSlugTouched, setOrganizationSlugTouched] = useState(false);
  const [platformName, setPlatformName] = useState('');
  const [platformSlug, setPlatformSlug] = useState('');
  const [platformSlugTouched, setPlatformSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const organizations = createdOrganization
    ? [...ownedOrganizations.filter((organization) => organization.id !== createdOrganization.id), createdOrganization]
    : ownedOrganizations;
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrgId) ?? null;

  async function loadOwnerOrganizations() {
    setLoadingOrganizations(true);
    setOrganizationLoadError(null);
    try {
      const result = await apiClient<PlatformOwnerOrganization[]>('/platforms/owner-organizations');
      setOwnedOrganizations(result);
      setSelectedOrgId((current) => current || result[0]?.id || '');
    } catch (error) {
      setOrganizationLoadError(error instanceof Error ? error.message : 'Gagal memuat organisasi pemilik.');
    } finally {
      setLoadingOrganizations(false);
    }
  }

  useEffect(() => {
    let active = true;
    apiClient<PlatformOwnerOrganization[]>('/platforms/owner-organizations')
      .then((result) => {
        if (!active) return;
        setOwnedOrganizations(result);
        setSelectedOrgId((current) => current || result[0]?.id || '');
      })
      .catch((error: unknown) => {
        if (active) {
          setOrganizationLoadError(error instanceof Error ? error.message : 'Gagal memuat organisasi pemilik.');
        }
      })
      .finally(() => {
        if (active) setLoadingOrganizations(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function continueToPlatform() {
    if (!selectedOrgId) {
      toast.error('Pilih organisasi pemilik Platform terlebih dahulu.');
      return;
    }
    setStep('platform');
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationName.trim()) return;

    setSubmitting(true);
    try {
      const organization = await apiClient<PlatformOwnerOrganization>('/platforms/owner-organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: organizationName.trim(),
          ...(organizationSlug.trim() ? { orgId: organizationSlug.trim() } : {}),
        }),
      });
      setCreatedOrganization(organization);
      setOwnedOrganizations((current) => [
        ...current.filter((item) => item.id !== organization.id),
        organization,
      ]);
      setSelectedOrgId(organization.id);
      setShowCreateOrganization(false);
      await refresh();
      setStep('platform');
      toast.success(`Organisasi "${organization.name}" berhasil dibuat.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat organisasi.');
    } finally {
      setSubmitting(false);
    }
  }

  function updatePlatformName(value: string) {
    setPlatformName(value);
    if (!platformSlugTouched) setPlatformSlug(slugify(value));
  }

  async function createPlatform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrgId) {
      setStep('organization');
      toast.error('Pilih organisasi pemilik Platform terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const platform = await apiClient<Platform>('/platforms', {
        method: 'POST',
        body: JSON.stringify({
          ownerOrgId: selectedOrgId,
          nama: platformName.trim(),
          slug: platformSlug.trim(),
        }),
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_PLATFORM_STORAGE_KEY, platform.id);
      }
      await refresh();
      toast.success(`Platform "${platform.nama}" berhasil dibuat.`);
      router.replace('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat Platform.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOrganizations) {
    return <LoadingSpinner label="Memuat organisasi…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Buat Platform</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ikuti dua langkah singkat untuk menyiapkan tenant dan Platform baru.
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className={`flex items-center gap-2 ${step === 'organization' ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border">
            {step === 'platform' ? <Check className="h-4 w-4" /> : '1'}
          </span>
          Organisasi
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === 'platform' ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border">2</span>
          Info Platform
        </div>
      </div>

      {step === 'organization' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {ownedOrganizations.length ? 'Pilih organisasi pemilik' : 'Organisasi pemilik'}
            </CardTitle>
            <CardDescription>
              Pilih organisasi Auth yang sudah Anda miliki. Organisasi baru hanya perlu dibuat jika memang belum ada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizationLoadError ? (
              <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  Daftar organisasi belum berhasil dimuat: {organizationLoadError}
                </p>
                <Button type="button" variant="outline" onClick={() => void loadOwnerOrganizations()}>
                  Coba lagi
                </Button>
              </div>
            ) : (
              <>
                {ownedOrganizations.length ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="owner-org-select">Organisasi pemilik</Label>
                      <select
                        id="owner-org-select"
                        value={selectedOrgId}
                        onChange={(event) => setSelectedOrgId(event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {ownedOrganizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>
                            {organization.name} ({organization.orgId})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={continueToPlatform} disabled={!selectedOrgId}>
                        Lanjut
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateOrganization((current) => !current)}
                      >
                        {showCreateOrganization ? 'Batal buat organisasi' : 'Buat organisasi baru'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">
                      Belum ada organisasi aktif dengan peran Owner yang terdeteksi. Jika Anda merasa sudah memilikinya,
                      coba muat ulang atau pastikan peran Anda di Auth adalah Owner sebelum membuat organisasi baru.
                    </p>
                    <Button type="button" variant="outline" onClick={() => void loadOwnerOrganizations()}>
                      Muat ulang daftar organisasi
                    </Button>
                    <Button type="button" onClick={() => setShowCreateOrganization(true)}>
                      Buat organisasi baru
                    </Button>
                  </div>
                )}
                {showCreateOrganization && (
                  <form onSubmit={createOrganization} className="space-y-4 border-t pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="organization-name">Nama organisasi</Label>
                      <Input
                        id="organization-name"
                        value={organizationName}
                        onChange={(event) => {
                          const value = event.target.value;
                          setOrganizationName(value);
                          if (!organizationSlugTouched) setOrganizationSlug(slugify(value));
                        }}
                        placeholder="Nama organisasi"
                        maxLength={255}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="organization-slug">Slug organisasi (opsional)</Label>
                      <Input
                        id="organization-slug"
                        value={organizationSlug}
                        onChange={(event) => {
                          setOrganizationSlugTouched(true);
                          setOrganizationSlug(slugify(event.target.value));
                        }}
                        placeholder="dibuat-otomatis-dari-nama"
                        maxLength={255}
                        disabled={submitting}
                      />
                    </div>
                    <Button type="submit" disabled={!organizationName.trim() || submitting}>
                      {submitting ? 'Membuat organisasi…' : 'Buat organisasi dan lanjut'}
                      {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Info dasar Platform</CardTitle>
            <CardDescription>
              Pengaturan lainnya dapat dilengkapi nanti dari halaman Platform Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPlatform} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="platform-name">Nama Platform</Label>
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(event) => updatePlatformName(event.target.value)}
                  placeholder="Contoh: Cerita Kita"
                  maxLength={255}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="platform-slug">Slug Platform</Label>
                <Input
                  id="platform-slug"
                  value={platformSlug}
                  onChange={(event) => {
                    setPlatformSlugTouched(true);
                    setPlatformSlug(slugify(event.target.value));
                  }}
                  placeholder="cerita-kita"
                  maxLength={255}
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">Slug digunakan untuk alamat subdomain Platform.</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                Organisasi pemilik: <span className="font-medium">{selectedOrganization?.name ?? '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('organization')} disabled={submitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
                <Button type="submit" disabled={!platformName.trim() || !platformSlug.trim() || submitting}>
                  {submitting ? 'Membuat Platform…' : 'Selesaikan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
