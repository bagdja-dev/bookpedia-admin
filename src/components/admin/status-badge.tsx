import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'border-emerald-700/15 bg-emerald-100 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'border-amber-700/15 bg-amber-100 text-amber-900 dark:border-amber-300/20 dark:bg-amber-950 dark:text-amber-200',
  danger: 'border-red-700/15 bg-red-100 text-red-900 dark:border-red-300/20 dark:bg-red-950 dark:text-red-200',
  neutral: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
