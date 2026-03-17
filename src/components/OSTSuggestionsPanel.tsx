import { useMemo, useState } from 'react';
import type { DraftSuggestionCard } from '../types/ostSuggestion';
import type { GeneratedOSTSuggestions, SuggestionConfidence } from '../types/ostSuggestion';

type OSTSuggestionsPanelProps = {
  suggestions: GeneratedOSTSuggestions | null;
  onApplySelected: (selectedCards: DraftSuggestionCard[]) => void;
};

const confidenceStyles: Record<SuggestionConfidence, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-200 text-slate-700',
};

type SectionProps = {
  title: string;
  subtitle: string;
  cardClassName: string;
  items: GeneratedOSTSuggestions['opportunities'];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
};

function SuggestionSection({
  title,
  subtitle,
  cardClassName,
  items,
  isSelected,
  onToggle,
}: SectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
            No clear draft cards detected for this category from current notes.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={`rounded-lg border p-3 ${cardClassName} ${
                isSelected(item.id) ? 'ring-1 ring-slate-400' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
                    aria-label={`Select suggestion: ${item.title}`}
                  />
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${confidenceStyles[item.confidence]}`}
                  >
                    {item.confidence}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs italic text-slate-600">{item.evidence}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export function OSTSuggestionsPanel({ suggestions, onApplySelected }: OSTSuggestionsPanelProps) {
  const generatedAtText = useMemo(() => {
    if (!suggestions) {
      return '';
    }
    return new Date(suggestions.generatedAt).toLocaleString();
  }, [suggestions]);

  const allCards = useMemo(() => {
    if (!suggestions) {
      return [];
    }
    return [...suggestions.opportunities, ...suggestions.solutions, ...suggestions.assumptions];
  }, [suggestions]);

  const [selectionOverrides, setSelectionOverrides] = useState<Record<string, boolean>>({});

  const isSelected = (id: string): boolean => selectionOverrides[id] ?? true;

  const selectedCards = useMemo(
    () => allCards.filter((item) => isSelected(item.id)),
    [allCards, selectionOverrides],
  );

  const toggleSelection = (id: string) => {
    setSelectionOverrides((current) => ({
      ...current,
      [id]: !isSelected(id),
    }));
  };

  const handleSelectAll = () => {
    const nextOverrides = allCards.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {});
    setSelectionOverrides(nextOverrides);
  };

  const handleClearSelection = () => {
    const nextOverrides = allCards.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {});
    setSelectionOverrides(nextOverrides);
  };

  if (!suggestions) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Generated OST suggestions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Import notes, then run suggestion generation to auto-detect draft opportunities,
          solutions, and assumptions.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Generated OST suggestions</h2>
          <p className="mt-1 text-xs text-slate-600">
            Draft cards extracted from imported notes. Select the cards you want to apply into the
            live OST board.
          </p>
        </div>
        <div className="text-xs text-slate-500">Generated at: {generatedAtText}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
            Opportunities: {suggestions.opportunities.length}
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
            Solutions: {suggestions.solutions.length}
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
            Assumptions: {suggestions.assumptions.length}
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
            Selected: {selectedCards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={handleClearSelection}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={() => onApplySelected(selectedCards)}
            disabled={selectedCards.length === 0}
            className="rounded-md bg-[#1D4ED8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Apply selected to OST
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <SuggestionSection
          title="Draft opportunities"
          subtitle="Auto-detected customer/business problems and opportunity statements."
          cardClassName="border-slate-200 bg-white"
          items={suggestions.opportunities}
          isSelected={isSelected}
          onToggle={toggleSelection}
        />
        <SuggestionSection
          title="Draft solutions"
          subtitle="Potential solution concepts inferred from action-oriented notes."
          cardClassName="border-[#D7CEFF] bg-[#EEEAFE]"
          items={suggestions.solutions}
          isSelected={isSelected}
          onToggle={toggleSelection}
        />
        <SuggestionSection
          title="Draft assumptions"
          subtitle="Beliefs and hypotheses requiring validation."
          cardClassName="border-[#F4CADC] bg-[#FDECF3]"
          items={suggestions.assumptions}
          isSelected={isSelected}
          onToggle={toggleSelection}
        />
      </div>
    </section>
  );
}
