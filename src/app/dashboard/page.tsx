import { redirect } from 'next/navigation';

// Belum punya halaman ringkasan dashboard sendiri — cukup arahkan ke
// Platform Settings (halaman utama yang selalu relevan baik untuk Owner
// maupun Staff). Revisit kalau butuh halaman ringkasan.
export default function DashboardIndexPage() {
  redirect('/dashboard/platform-settings');
}
