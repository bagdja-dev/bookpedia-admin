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

export type PlatformSettingsSection =
  | 'identity'
  | 'reader-colors'
  | 'typography'
  | 'seo'
  | 'author-access'
  | 'reader-rules'
  | 'content-protection'
  | 'adsense'
  | 'ads'
  | 'owner-wallet'
  | 'search-console'
  | 'android'
  | 'domain'
  | 'studio'
  | 'legal'
  | 'contact';

export interface PlatformSettingsNavItem {
  section: PlatformSettingsSection;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

export interface PlatformSettingsNavGroup {
  id: string;
  label: string;
  items: readonly PlatformSettingsNavItem[];
}

export const PLATFORM_SETTINGS_NAV_GROUPS: readonly PlatformSettingsNavGroup[] = [
  {
    id: 'identity',
    label: 'Identitas Platform',
    items: [
      { section: 'identity', label: 'Identitas & aset', icon: Settings },
      { section: 'reader-colors', label: 'Warna & tampilan reader', icon: Palette },
      { section: 'typography', label: 'Tipografi bacaan', icon: BookOpen },
    ],
  },
  {
    id: 'content-catalog',
    label: 'Konten & Katalog',
    items: [
      { section: 'seo', label: 'SEO', icon: Search },
    ],
  },
  {
    id: 'reader-experience',
    label: 'Pengalaman Pembaca',
    items: [
      { section: 'author-access', label: 'Akses pendaftaran penulis', icon: Users },
      { section: 'reader-rules', label: 'Aturan pembaca', icon: BookOpen },
      { section: 'content-protection', label: 'Perlindungan konten', icon: Shield },
    ],
  },
  {
    id: 'growth',
    label: 'Pertumbuhan & Pendapatan',
    items: [
      { section: 'adsense', label: 'Google AdSense', icon: Megaphone },
      { section: 'ads', label: 'Iklan', icon: Megaphone },
      { section: 'owner-wallet', label: 'Wallet donasi', icon: Heart, ownerOnly: true },
      { section: 'search-console', label: 'Google Search Console', icon: Search },
    ],
  },
  {
    id: 'distribution',
    label: 'Distribusi Aplikasi',
    items: [
      { section: 'android', label: 'Aplikasi Android', icon: Smartphone },
    ],
  },
  {
    id: 'access-domain',
    label: 'Akses & Domain',
    items: [
      { section: 'domain', label: 'Domain kustom', icon: Globe },
    ],
  },
  {
    id: 'general',
    label: 'Pengaturan Umum',
    items: [
      { section: 'studio', label: 'Studio Settings', icon: SlidersHorizontal },
      { section: 'legal', label: 'Tentang, legal & disclaimer', icon: Globe },
      { section: 'contact', label: 'Kontak', icon: Globe },
    ],
  },
] as const satisfies readonly PlatformSettingsNavGroup[];

export const PLATFORM_SETTINGS_NAV_ITEMS: PlatformSettingsNavItem[] = PLATFORM_SETTINGS_NAV_GROUPS.flatMap((group) => group.items);

export function isPlatformSettingsSection(value: string): value is PlatformSettingsSection {
  return PLATFORM_SETTINGS_NAV_ITEMS.some((item) => item.section === value);
}

export function platformSettingsPath(section: PlatformSettingsSection) {
  return `/dashboard/platform-settings/${section}`;
}
