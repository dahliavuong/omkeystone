import { type PropsWithChildren } from 'react';

type LevelRowProps = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

export function LevelRow({ title, className = '', children }: LevelRowProps) {
  return (
    <section className={`w-full ${className}`}>
      {title ? (
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
      ) : null}
      {children}
    </section>
  );
}
