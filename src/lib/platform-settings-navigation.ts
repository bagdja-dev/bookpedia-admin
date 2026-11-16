import {
  BookOpen,
  Globe,
  Heart,
  Megaphone,
  Palette,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const PLATFORM_SETTINGS_NAV_ITEMS = [
  { section: 'identity', label: 'Identitas & aset', icon: Settings },
  { section: 'reader-colors', label: 'Warna & tampilan reader', icon: Palette },
  { section: 'studio', label: 'Studio Settings', icon: SlidersHorizontal },
  { section: 'adsense', label: 'Google AdSense', icon: Megaphone },
  { section: 'author-access', label: 'Akses pendaftaran penulis', icon: Users },
  { section: 'reader-rules', label: 'Aturan pembaca', icon: BookOpen },
  { section: 'content-protection', label: 'Perlindungan konten', icon: Shield },
  { section: 'seo', label: 'SEO', icon: Search },
  { section: 'legal', label: 'Tentang, legal & disclaimer', icon: Globe },
  { section: 'typography', label: 'Tipografi bacaan', icon: BookOpen },
  { section: 'ads', label: 'Iklan', icon: Megaphone },
  { section: 'contact', label: 'Kontak', icon: Globe },
  { section: 'owner-wallet', label: 'Wallet donasi', icon: Heart, ownerOnly: true },
  { section: 'search-console', label: 'Google Search Console', icon: Search },
  { section: 'android', label: 'Aplikasi Android', icon: Smartphone },
  { section: 'domain', label: 'Domain kustom', icon: Globe },
] as const satisfies readonly {
  section: string;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}[];

export type PlatformSettingsSection = (typeof PLATFORM_SETTINGS_NAV_ITEMS)[number]['section'];

export function isPlatformSettingsSection(value: string): value is PlatformSettingsSection {
  return PLATFORM_SETTINGS_NAV_ITEMS.some((item) => item.section === value);
}

export function platformSettingsPath(section: PlatformSettingsSection) {
  return `/dashboard/platform-settings/${section}`;
}
