type LegendItem = {
  label: string;
  description: string;
  dotClassName: string;
};

const legendItems: LegendItem[] = [
  {
    label: 'Outcome',
    description: 'what desired business outcome should be achieved',
    dotClassName: 'bg-slate-900',
  },
  {
    label: 'Opportunity Spaces',
    description: 'key business entities or domains',
    dotClassName: 'bg-[#D8BFA6]',
  },
  {
    label: 'Big opportunities',
    description: 'major opportunity themes',
    dotClassName: 'bg-[#8BB4FA]',
  },
  {
    label: 'Smaller opportunities',
    description: 'more specific customer or business problems',
    dotClassName: 'bg-slate-300',
  },
  {
    label: 'Solutions',
    description: 'possible responses to the opportunities',
    dotClassName: 'bg-[#B8A3FF]',
  },
  {
    label: 'Assumptions',
    description: 'beliefs that need validation',
    dotClassName: 'bg-[#F5AFCF]',
  },
];

export function LegendPanel() {
  return (
    <aside className="sticky left-0 top-0 z-30 h-screen w-80 shrink-0 border-r border-slate-200 bg-white/95 px-5 py-6 backdrop-blur">
      <h2 className="text-base font-semibold text-slate-900">OST Guide</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Strategic hierarchy used in workshop planning sessions.
      </p>

      <ul className="mt-5 space-y-3">
        {legendItems.map((item) => (
          <li key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${item.dotClassName}`}
              />
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
            </div>
            <p className="mt-1 pl-4 text-xs leading-relaxed text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
