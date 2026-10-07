'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Download, Play, RefreshCw, Rocket, Save } from 'lucide-react';

import { ImageUpload } from '@/components/image-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlatformContext } from '@/context/platform-context';
import { ApiError, apiClient } from '@/lib/api-client';
import type {
  CreatePlatformBuildJobPayload,
  PlatformBuildConfig,
  PlatformBuildJob,
  PlatformBuildJobStatus,
  PlatformBuildOutputFormat,
  PlatformBuildType,
  PlatformKeystoreProfile,
} from '@/lib/types';

const statusLabels: Record<PlatformBuildJobStatus, string> = {
  queued: 'Queued',
  validating: 'Validating',
  building: 'Building',
  signing: 'Signing',
  uploading: 'Uploading',
  success: 'Success',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const statusTone: Record<PlatformBuildJobStatus, string> = {
  queued: 'bg-slate-100 text-slate-700',
  validating: 'bg-blue-100 text-blue-700',
  building: 'bg-amber-100 text-amber-700',
  signing: 'bg-violet-100 text-violet-700',
  uploading: 'bg-cyan-100 text-cyan-700',
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-700',
};

type BuildVariantOption = 'aab-release' | 'apk-release' | 'apk-debug';

const buildVariantOptions: Record<BuildVariantOption, { label: string; buildType: PlatformBuildType; outputFormat: PlatformBuildOutputFormat }> = {
  'aab-release': { label: 'AAB Release (Play Store)', buildType: 'release', outputFormat: 'aab' },
  'apk-release': { label: 'APK Release (instal langsung)', buildType: 'release', outputFormat: 'apk' },
  'apk-debug': { label: 'APK Debug (testing, tanpa keystore)', buildType: 'debug', outputFormat: 'apk' },
};

function formatVariant(job: PlatformBuildJob) {
  if (!job.output_format || !job.build_type) return '-';
  return `${job.output_format.toUpperCase()} · ${job.build_type === 'debug' ? 'Debug' : 'Release'}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function PlatformBuildsSection() {
  const { activePlatform, isOwner } = usePlatformContext();
  const [jobs, setJobs] = useState<PlatformBuildJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [keystoreProfiles, setKeystoreProfiles] = useState<PlatformKeystoreProfile[]>([]);
  const [keystoreFile, setKeystoreFile] = useState<File | null>(null);
  const [buildVariant, setBuildVariant] = useState<BuildVariantOption>('aab-release');
  const [iconUploading, setIconUploading] = useState(false);
  const [splashUploading, setSplashUploading] = useState(false);
  const [form, setForm] = useState({
    appName: '',
    bundleId: '',
    targetUrl: '',
    environment: 'prod' as 'dev' | 'staging' | 'prod',
    versionName: '1.0.0',
    versionCode: '1',
    iconUrl: '',
    splashImageUrl: '',
    primaryColor: '#7C3AED',
    splashColor: '#0F172A',
    keystoreProfileId: '',
    keystoreName: '',
    keystoreAlias: '',
    passwordSecretRef: '',
    keyPasswordSecretRef: '',
  });

  async function loadJobs() {
    if (!activePlatform) return;
    setLoadingJobs(true);
    setError(null);
    try {
      const data = await apiClient<PlatformBuildJob[]>(`/platform-builds/jobs?platformId=${activePlatform.id}`);
      const refreshedJobs = await Promise.all(data.map(async (job) => {
        if (!job.external_job_id) return job;
        try {
          return await apiClient<PlatformBuildJob>(`/platform-builds/jobs/${job.id}/status`);
        } catch {
          return job;
        }
      }));
      setJobs(refreshedJobs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tidak dapat memuat build job.');
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    if (!activePlatform || !jobs.some((job) => job.external_job_id && ['queued', 'validating', 'building', 'signing', 'uploading'].includes(job.status))) {
      return;
    }

    let cancelled = false;
    const poll = async () => {
      const activeJobs = jobs.filter((job) => job.external_job_id && ['queued', 'validating', 'building', 'signing', 'uploading'].includes(job.status));
      const refreshed = await Promise.all(activeJobs.map(async (job) => {
        try {
          return [job.id, await apiClient<PlatformBuildJob>(`/platform-builds/jobs/${job.id}/status`)] as const;
        } catch {
          return [job.id, null] as const;
        }
      }));
      if (cancelled) return;
      const byId = new Map(refreshed.filter((entry): entry is readonly [string, PlatformBuildJob] => entry[1] !== null));
      if (byId.size) {
        setJobs((current) => current.map((job) => byId.get(job.id) ?? job));
      }
    };

    const interval = setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activePlatform?.id, jobs]);

  useEffect(() => {
    if (!activePlatform) {
      setJobs([]);
      setKeystoreProfiles([]);
      setConfigId(null);
      return;
    }
    setJobs([]);
    setKeystoreProfiles([]);
    setForm({
      // Identitas app Android (nama, icon, splash) sengaja terpisah dari nama/logo Platform.
      appName: '',
      bundleId: '',
      targetUrl: activePlatform.domain ? `https://${activePlatform.domain}` : `https://${activePlatform.slug}.bookpedia.bagdja.com`,
      environment: 'prod',
      versionName: '1.0.0',
      versionCode: '1',
      iconUrl: '',
      splashImageUrl: '',
      primaryColor: '#7C3AED',
      splashColor: '#0F172A',
      keystoreProfileId: '',
      keystoreName: '',
      keystoreAlias: '',
      passwordSecretRef: '',
      keyPasswordSecretRef: '',
    });
    setConfigId(null);
    setKeystoreFile(null);
    void Promise.all([
      apiClient<PlatformBuildConfig[]>(`/platform-builds/platforms/${activePlatform.id}/configs`),
      apiClient<PlatformKeystoreProfile[]>(`/platform-builds/platforms/${activePlatform.id}/keystore-profiles`),
      loadJobs(),
    ]).then(([configs, profiles]) => {
      const config = configs.find((item) => item.environment === 'prod') ?? configs[0];
      setKeystoreProfiles(profiles);
      if (config) {
        const flags = config.build_flags ?? {};
        const theme = (flags.theme ?? {}) as { primaryColor?: string; splashColor?: string };
        setConfigId(config.id);
        setForm((current) => ({
          ...current,
          appName: typeof flags.appName === 'string' ? flags.appName : current.appName,
          bundleId: typeof flags.bundleId === 'string' ? flags.bundleId : current.bundleId,
          targetUrl: typeof flags.targetUrl === 'string' ? flags.targetUrl : current.targetUrl,
          iconUrl: typeof flags.iconUrl === 'string' ? flags.iconUrl : current.iconUrl,
          splashImageUrl: typeof flags.splashImageUrl === 'string' ? flags.splashImageUrl : current.splashImageUrl,
          environment: config.environment,
          versionName: config.version_name,
          versionCode: String(config.version_code),
          primaryColor: theme.primaryColor ?? current.primaryColor,
          splashColor: theme.splashColor ?? current.splashColor,
          keystoreProfileId: config.keystore_profile_id ?? '',
        }));
      }
      const selectedProfile = profiles.find((profile) => profile.id === config?.keystore_profile_id);
      if (selectedProfile) {
        setForm((current) => ({
          ...current,
          keystoreName: selectedProfile.name,
          keystoreAlias: selectedProfile.alias,
          passwordSecretRef: selectedProfile.password_secret_ref,
          keyPasswordSecretRef: selectedProfile.key_password_secret_ref ?? '',
        }));
      }
    }).catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pengaturan build.');
    });
  }, [activePlatform?.id]);

  function handleChange(field: keyof typeof form, value: string) {
    setConfigId(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectKeystoreProfile(profileId: string) {
    setConfigId(null);
    setKeystoreFile(null);
    const profile = keystoreProfiles.find((item) => item.id === profileId);
    setForm((current) => ({
      ...current,
      keystoreProfileId: profileId,
      keystoreName: profile?.name ?? '',
      keystoreAlias: profile?.alias ?? '',
      passwordSecretRef: profile?.password_secret_ref ?? '',
      keyPasswordSecretRef: profile?.key_password_secret_ref ?? '',
    }));
  }

  async function handleSave() {
    if (!activePlatform || !isOwner) return;
    setSaving(true);
    setError(null);
    try {
      let keystoreProfileId = form.keystoreProfileId || null;
      if (keystoreFile) {
        const body = new FormData();
        body.append('platformId', activePlatform.id);
        body.append('file', keystoreFile);
        body.append('name', form.keystoreName.trim());
        body.append('alias', form.keystoreAlias.trim());
        body.append('passwordSecretRef', form.passwordSecretRef.trim());
        body.append('keyPasswordSecretRef', form.keyPasswordSecretRef.trim());
        const upload = await fetch('/api/uploads/keystore', { method: 'POST', body });
        const response = await upload.json();
        if (!upload.ok) throw new Error(response.error ?? 'Upload JKS gagal.');
        const profile = response as PlatformKeystoreProfile;
        keystoreProfileId = profile.id;
        setKeystoreProfiles((current) => [profile, ...current.filter((item) => item.id !== profile.id)]);
        setForm((current) => ({ ...current, keystoreProfileId: profile.id }));
        setKeystoreFile(null);
      }

      const config = await apiClient<PlatformBuildConfig>('/platform-builds/configs', {
        method: 'POST',
        body: JSON.stringify({
          platformId: activePlatform.id,
          environment: form.environment,
          versionName: form.versionName.trim(),
          versionCode: Number(form.versionCode),
          keystoreProfileId,
          buildFlags: {
            appName: form.appName.trim(),
            bundleId: form.bundleId.trim(),
            targetUrl: form.targetUrl.trim(),
            iconUrl: form.iconUrl.trim(),
            splashImageUrl: form.splashImageUrl.trim(),
            theme: { primaryColor: form.primaryColor, splashColor: form.splashColor },
          },
        }),
      });
      setConfigId(config.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal menyimpan build settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!activePlatform || !isOwner) return;
    setSubmitting(true);
    setError(null);
    const payload: CreatePlatformBuildJobPayload = {
      platformId: activePlatform.id,
      appName: form.appName.trim(),
      bundleId: form.bundleId.trim(),
      targetUrl: form.targetUrl.trim(),
      iconUrl: form.iconUrl.trim() || undefined,
      splashImageUrl: form.splashImageUrl.trim() || undefined,
      theme: { primaryColor: form.primaryColor, splashColor: form.splashColor },
      configId,
      buildType: buildVariantOptions[buildVariant].buildType,
      outputFormat: buildVariantOptions[buildVariant].outputFormat,
    };

    try {
      await apiClient('/platform-builds/jobs', { method: 'POST', body: JSON.stringify(payload) });
      await loadJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memulai build.');
    } finally {
      setSubmitting(false);
    }
  }

  const isReleaseBuild = buildVariantOptions[buildVariant].buildType === 'release';
  const needsKeystore = isReleaseBuild && !form.keystoreProfileId;
  const canSubmit = Boolean(
    isOwner && activePlatform && form.appName.trim() && form.bundleId.trim() && form.targetUrl.trim()
    && form.versionName.trim() && Number.isInteger(Number(form.versionCode)) && Number(form.versionCode) > 0
    && !needsKeystore,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> Platform Build</CardTitle>
          <CardDescription>Build TWA untuk platform aktif dan riwayat artifact-nya.</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadJobs()} disabled={loadingJobs || !activePlatform}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingJobs ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!activePlatform ? (
          <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Pilih platform untuk melihat dan memulai build.</p>
        ) : (
          <>
            <div>
              <h3 className="mb-3 text-base font-semibold">Build configuration</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="build-app-name">App name</Label>
                <Input id="build-app-name" value={form.appName} onChange={(e) => handleChange('appName', e.target.value)} placeholder={activePlatform.nama} maxLength={50} required />
                <p className="text-xs text-muted-foreground">Nama yang tampil di bawah icon launcher Android.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-bundle-id">Bundle ID</Label>
                <Input id="build-bundle-id" value={form.bundleId} onChange={(e) => handleChange('bundleId', e.target.value)} placeholder="com.bagdja.novello" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-target-url">Target URL</Label>
                <Input id="build-target-url" type="url" value={form.targetUrl} onChange={(e) => handleChange('targetUrl', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-environment">Environment</Label>
                <select id="build-environment" value={form.environment} onChange={(e) => handleChange('environment', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="dev">Development</option><option value="staging">Staging</option><option value="prod">Production</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-version-name">Version name</Label>
                <Input id="build-version-name" value={form.versionName} onChange={(e) => handleChange('versionName', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-version-code">Version code</Label>
                <Input id="build-version-code" type="number" min="1" step="1" value={form.versionCode} onChange={(e) => handleChange('versionCode', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-primary-color">Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="build-primary-color"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : '#000000'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border p-0.5"
                    aria-label="Primary color picker"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#000000"
                    aria-label="Primary color hex"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="build-splash-color">Splash color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="build-splash-color"
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.splashColor) ? form.splashColor : '#000000'}
                    onChange={(e) => handleChange('splashColor', e.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border p-0.5"
                    aria-label="Splash color picker"
                  />
                  <Input
                    value={form.splashColor}
                    onChange={(e) => handleChange('splashColor', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#000000"
                    aria-label="Splash color hex"
                  />
                </div>
              </div>
              </div>
            </div>

            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-base font-semibold">Icon &amp; splash screen</h3>
                <p className="text-sm text-muted-foreground">Diunggah khusus untuk app Android, terpisah dari logo Platform. Gunakan PNG; icon persegi minimal 512×512 dengan ruang kosong di tepi, splash dengan latar transparan (ditampilkan di tengah di atas Splash color, maks 1024px).</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUpload
                  id="build-icon"
                  label="App icon"
                  folder="platform-builds"
                  value={form.iconUrl}
                  onChange={(url) => handleChange('iconUrl', url)}
                  disabled={!isOwner || saving || submitting}
                  onUploadingChange={setIconUploading}
                  previewWidth={96}
                  previewHeight={96}
                />
                <ImageUpload
                  id="build-splash"
                  label="Splash screen image"
                  folder="platform-builds"
                  value={form.splashImageUrl}
                  onChange={(url) => handleChange('splashImageUrl', url)}
                  disabled={!isOwner || saving || submitting}
                  onUploadingChange={setSplashUploading}
                  previewWidth={160}
                  previewHeight={96}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-base font-semibold">Android signing</h3>
                <p className="text-sm text-muted-foreground">Keystore diunggah privat. Password tidak dimasukkan di sini; isi referensi secret yang tersedia untuk builder. Keystore hanya wajib untuk build release; APK Debug memakai debug key builder.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="build-keystore-profile">Keystore profile</Label>
                  <select id="build-keystore-profile" value={form.keystoreProfileId} onChange={(e) => selectKeystoreProfile(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="">Upload keystore baru</option>
                    {keystoreProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.alias}</option>)}
                  </select>
                </div>
                {!form.keystoreProfileId && <>
                  <div className="space-y-1.5">
                    <Label htmlFor="keystore-file">JKS file</Label>
                    <Input id="keystore-file" type="file" accept=".jks,application/octet-stream" onChange={(e) => { setConfigId(null); setKeystoreFile(e.target.files?.[0] ?? null); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="keystore-name">Profile name</Label>
                    <Input id="keystore-name" value={form.keystoreName} onChange={(e) => handleChange('keystoreName', e.target.value)} placeholder="Novello Play signing" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="keystore-alias">Key alias</Label>
                    <Input id="keystore-alias" value={form.keystoreAlias} onChange={(e) => handleChange('keystoreAlias', e.target.value)} placeholder="novello-release" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="keystore-password-ref">Keystore password secret reference</Label>
                    <Input id="keystore-password-ref" value={form.passwordSecretRef} onChange={(e) => handleChange('passwordSecretRef', e.target.value)} placeholder="secret://bookpedia/novello/store-password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="key-password-ref">Key password secret reference</Label>
                    <Input id="key-password-ref" value={form.keyPasswordSecretRef} onChange={(e) => handleChange('keyPasswordSecretRef', e.target.value)} placeholder="secret://bookpedia/novello/key-password" />
                  </div>
                </>}
              </div>
            </section>

            {!isOwner && <p className="text-sm text-muted-foreground">Hanya Owner yang dapat memulai build.</p>}
            {error && <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            {needsKeystore && <p className="text-sm text-muted-foreground">Build release membutuhkan keystore profile yang sudah disimpan. Pilih APK Debug untuk build testing tanpa keystore.</p>}
            <div className="flex flex-col gap-2 border-b pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
              <div className="space-y-1.5 sm:mr-auto sm:w-72">
                <Label htmlFor="build-variant">Output build</Label>
                <select id="build-variant" value={buildVariant} onChange={(e) => setBuildVariant(e.target.value as BuildVariantOption)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  {(Object.keys(buildVariantOptions) as BuildVariantOption[]).map((key) => <option key={key} value={key}>{buildVariantOptions[key].label}</option>)}
                </select>
              </div>
              <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={!isOwner || saving || iconUploading || splashUploading || !form.appName.trim() || !form.bundleId.trim() || !form.targetUrl.trim() || !form.versionName.trim() || !Number.isInteger(Number(form.versionCode)) || Number(form.versionCode) < 1 || (!form.keystoreProfileId && Boolean(keystoreFile) && (!form.keystoreName.trim() || !form.keystoreAlias.trim() || !form.passwordSecretRef.trim() || !form.keyPasswordSecretRef.trim()))}>
                <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Simpan'}
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit || !configId || submitting || iconUploading || splashUploading}>
                <Play className="mr-2 h-4 w-4" />{submitting ? 'Starting build...' : 'Start Build'}
              </Button>
            </div>

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">Build history</h3>
                <p className="text-sm text-muted-foreground">Riwayat build untuk {activePlatform.nama}.</p>
              </div>
              {loadingJobs ? (
                <p className="py-8 text-sm text-muted-foreground">Memuat build history...</p>
              ) : jobs.length === 0 ? (
                <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada build yang dijalankan untuk platform ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Status</TableHead><TableHead>Output</TableHead><TableHead>Progress</TableHead><TableHead>Created</TableHead><TableHead>Started</TableHead><TableHead>Artifact</TableHead><TableHead>Logs</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                          <TableCell><Badge className={statusTone[job.status] ?? 'bg-slate-100 text-slate-700'}>{statusLabels[job.status] ?? job.status}</Badge></TableCell>
                          <TableCell className="text-sm">
                            <div className="whitespace-nowrap">{formatVariant(job)}</div>
                            {job.signing_cert_sha256 && (
                              <div className="max-w-48 truncate font-mono text-[10px] text-muted-foreground" title={`SHA-256: ${job.signing_cert_sha256}`}>
                                SHA-256 {job.signing_cert_sha256}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="min-w-36">
                            <div className="text-sm">{job.progress ?? 0}%</div>
                            {job.stage && <div className="text-xs text-muted-foreground">{job.stage}</div>}
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
                              <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(0, Math.min(100, job.progress ?? 0))}%` }} />
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(job.created_at)}</TableCell>
                          <TableCell>{formatDate(job.started_at)}</TableCell>
                          <TableCell>{job.artifact_url ? <a href={job.artifact_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline"><Download className="mr-1 h-3.5 w-3.5" />Download</a> : <span className="text-muted-foreground">-</span>}</TableCell>
                          <TableCell>{job.log_url ? <a href={job.log_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View logs</a> : <span className="text-muted-foreground">-</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
