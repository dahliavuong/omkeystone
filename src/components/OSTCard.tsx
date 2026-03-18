import { useCallback, type PropsWithChildren } from 'react';

type OSTCardVariant =
  | 'outcome'
  | 'opportunitySpace'
  | 'bigOpportunity'
  | 'smallerOpportunity'
  | 'solution'
  | 'assumption';

type OSTCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  variant: OSTCardVariant;
  className?: string;
  italicQuote?: string;
  nodeId?: string;
  registerNode?: (id: string, element: HTMLDivElement | null) => void;
}>;

const variantClasses: Record<OSTCardVariant, string> = {
  outcome:
    'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10',
  opportunitySpace:
    'bg-[#F3EDE6] text-slate-800 border-[#DECFC0] shadow-md shadow-slate-300/50',
  bigOpportunity:
    'bg-[#E6F0FF] text-slate-900 border-[#C7DDFE] shadow-md shadow-blue-100/70',
  smallerOpportunity:
    'bg-white text-slate-800 border-slate-200 shadow-sm shadow-slate-200/70',
  solution:
    'bg-[#EEEAFE] text-slate-900 border-[#D7CEFF] shadow-sm shadow-purple-100/80',
  assumption:
    'bg-[#FDECF3] text-slate-800 border-[#F4CADC] shadow-sm shadow-pink-100/70',
};

export function OSTCard({
  title,
  subtitle,
  variant,
  className = '',
  italicQuote,
  children,
  nodeId,
  registerNode,
}: OSTCardProps) {
  const handleRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (nodeId && registerNode) {
        registerNode(nodeId, element);
      }
    },
    [nodeId, registerNode],
  );

  return (
    <div
      ref={handleRef}
      className={`rounded-xl border px-4 py-3 text-left ${variantClasses[variant]} ${className}`}
    >
      {italicQuote ? (
        <p className="mb-2 text-xs italic leading-relaxed text-slate-600">{italicQuote}</p>
      ) : null}
      {title ? <h3 className="text-sm font-semibold leading-snug">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-xs leading-relaxed opacity-85">{subtitle}</p> : null}
      {children}
    </div>
  );
}
