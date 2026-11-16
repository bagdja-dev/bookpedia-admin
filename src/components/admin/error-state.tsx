import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry} className="shrink-0">
          Coba lagi
        </Button>
      )}
    </section>
  );
}
