'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  History,
  LayoutDashboard,
  Library,
  PanelsTopLeft,
  Tag,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePlatformContext } from '@/context/platform-context';
import { PLATFORM_SETTINGS_NAV_GROUPS, PLATFORM_SETTINGS_NAV_ITEMS, platformSettingsPath } from '@/lib/platform-settings-navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  subgroups?: {
    id: string;
    label: string;
    items: NavItem[];
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Ringkasan',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'content',
    label: 'Konten & Katalog',
    items: [
      { href: '/dashboard/homepage', label: 'Homepage', icon: PanelsTopLeft },
      { href: '/dashboard/genres', label: 'Genres', icon: Library },
      { href: '/dashboard/categories', label: 'Categories', icon: Tag },
    ],
  },
  {
    id: 'growth',
    label: 'Pertumbuhan & Pendapatan',
    items: [
      { href: '/dashboard/donations', label: 'Donasi Platform', icon: Heart },
      { href: '/dashboard/donations/history', label: 'Riwayat Donasi', icon: History },
    ],
  },
  {
    id: 'readers',
    label: 'Pembaca',
    items: [{ href: '/dashboard/users', label: 'Users', icon: UserRound }],
  },
  {
    id: 'platform',
    label: 'Platform Settings',
    items: PLATFORM_SETTINGS_NAV_ITEMS.map((item) => ({
      href: platformSettingsPath(item.section),
      label: item.label,
      icon: item.icon,
      ...('ownerOnly' in item ? { ownerOnly: item.ownerOnly } : {}),
    })),
    subgroups: PLATFORM_SETTINGS_NAV_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items.map((item) => ({
        href: platformSettingsPath(item.section),
        label: item.label,
        icon: item.icon,
        ...('ownerOnly' in item ? { ownerOnly: item.ownerOnly } : {}),
      })),
    })),
  },
  {
    id: 'access',
    label: 'Akses',
    items: [{ href: '/dashboard/staff', label: 'Staff', icon: Users, ownerOnly: true }],
  },
];

function isItemActive(pathname: string | null, href: string) {
  if (href.startsWith('/dashboard/platform-settings/')) return pathname === href;
  const route = href;
  if (route === '/dashboard') return pathname === route;
  return pathname === route || Boolean(pathname?.startsWith(`${route}/`));
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { isOwner } = usePlatformContext();
  const activeGroupId = NAV_GROUPS.find((group) => group.items.some((item) => isItemActive(pathname, item.href)))?.id
    ?? (pathname?.startsWith('/dashboard/platform-settings') ? 'platform' : undefined);
  const [groupState, setGroupState] = useState<{ pathname: string | null; ids: string[] } | null>(null);
  const expandedGroups = groupState?.pathname === pathname
    ? groupState.ids
    : activeGroupId ? [activeGroupId] : [];

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function toggleGroup(groupId: string) {
    const groups = groupState?.pathname === pathname
      ? groupState.ids
      : activeGroupId ? [activeGroupId] : [];
    setGroupState({
      pathname,
      ids: groups.includes(groupId) ? groups.filter((id) => id !== groupId) : [...groups, groupId],
    });
  }

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const active = isItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          collapsed && 'lg:justify-center lg:px-2',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
          onClick={onClose}
          aria-label="Tutup menu navigasi"
        />
      )}

      <aside
        id="primary-navigation"
        aria-label="Navigasi utama"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 lg:transition-[width]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-16',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4', collapsed && 'lg:justify-center lg:px-0')}>
          <span className={cn('text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground', collapsed && 'lg:hidden')}>
            Navigasi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => (
              !item.ownerOnly || isOwner
            ));
            const visibleSubgroups = group.subgroups?.map((subgroup) => ({
              ...subgroup,
              items: subgroup.items.filter((item) => !item.ownerOnly || isOwner),
            })).filter((subgroup) => subgroup.items.length > 0);
            if (visibleItems.length === 0) return null;

            const isExpanded = expandedGroups.includes(group.id);
            return (
              <section key={group.id} aria-label={group.label}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    collapsed && 'lg:hidden',
                  )}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`sidebar-group-${group.id}`}
                >
                  {group.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} aria-hidden="true" />
                </button>
                <div
                  id={`sidebar-group-${group.id}`}
                  className={cn(
                    'space-y-1',
                    isExpanded ? 'block' : 'hidden',
                    collapsed && 'lg:block',
                  )}
                >
                  {visibleSubgroups
                    ? visibleSubgroups.map((subgroup) => (
                      <div key={subgroup.id} className="space-y-1">
                        <p className={cn(
                          'px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground',
                          collapsed && 'lg:hidden',
                        )}>
                          {subgroup.label}
                        </p>
                        {subgroup.items.map(renderNavItem)}
                      </div>
                    ))
                    : visibleItems.map(renderNavItem)}
                </div>
              </section>
            );
          })}
        </nav>

        <div className="hidden shrink-0 border-t border-sidebar-border p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {!collapsed && 'Ciutkan'}
          </button>
        </div>
      </aside>
    </>
  );
}
