import { notFound, redirect } from 'next/navigation';

import { PlatformSettingsPage } from '@/app/dashboard/platform-settings/page';
import { isPlatformSettingsSection } from '@/lib/platform-settings-navigation';

export default async function PlatformSettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === 'android-links' || section === 'builds') {
    redirect('/dashboard/platform-settings/android');
  }
  if (!isPlatformSettingsSection(section)) notFound();

  return <PlatformSettingsPage section={section} />;
}
