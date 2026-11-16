import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-xl border border-dashed bg-card/70 px-6 py-10 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </section>
  );
}
