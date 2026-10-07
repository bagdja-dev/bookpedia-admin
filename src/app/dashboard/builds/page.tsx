import { redirect } from 'next/navigation';

export default function BuildsRedirectPage() {
  redirect('/dashboard/platform-settings');
}
