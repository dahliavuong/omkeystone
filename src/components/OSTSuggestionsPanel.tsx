import { useMemo, useState } from 'react';
import type { OSTData } from '../types/ost';
import type { DraftSuggestionCard } from '../types/ostSuggestion';
import type { GeneratedOSTSuggestions, SuggestionConfidence } from '../types/ostSuggestion';
import {
  reviewDraftSuggestionLine,
  type SuggestionLineReview,
} from '../utils/suggestionReview';
import {
  buildFullStructureReview,
  type StructureLineReview,
} from '../utils/structureReview';
import type { ApplyStructureSeeds } from '../utils/ostDraft';

type OSTSuggestionsPanelProps = {
  suggestions: GeneratedOSTSuggestions | null;
  onApplySelected: (selectedCards: DraftSuggestionCard[], seeds?: ApplyStructureSeeds) => void;
  ostData: OSTData;
  projectContext: string;
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
  lineReviews: Record<string, SuggestionLineReview>;
};

function SuggestionSection({
  title,
  subtitle,
  cardClassName,
  items,
  isSelected,
  onToggle,
  lineReviews,
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

              {lineReviews[item.id] ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Improved line
                    </p>
                    <p className="mt-1 text-xs font-medium text-emerald-800">
                      {lineReviews[item.id].improvedLine}
                    </p>
                    {lineReviews[item.id].recommendedQuote ? (
                      <p className="mt-1 text-xs italic text-emerald-700">
                        {lineReviews[item.id].recommendedQuote}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-800">Comment:</span>{' '}
                    {lineReviews[item.id].comment}
                  </p>
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-800">Recommendation:</span>{' '}
                    {lineReviews[item.id].recommendation}
                  </p>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

type StructureSectionProps = {
  title: string;
  lines: StructureLineReview[];
};

function StructureSection({ title, lines }: StructureSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 space-y-2">
        {lines.map((line, index) => (
          <article key={`${title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Original:</span> {line.original}
            </p>
            <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Improved line
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-800">{line.improved}</p>
            </div>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-800">Comment:</span> {line.comment}
            </p>
            <p className="mt-1 text-xs text-slate-700">
              <span className="font-semibold text-slate-800">Recommendation:</span>{' '}
              {line.recommendation}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function OSTSuggestionsPanel({
  suggestions,
  onApplySelected,
  ostData,
  projectContext,
}: OSTSuggestionsPanelProps) {
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

  const selectedCards = allCards.filter((item) => isSelected(item.id));
  const normalizedContext =
    projectContext.trim() ||
    'No explicit project context provided. Evaluate based on the current OST and available note-derived signals.';
  const lineReviews = useMemo<Record<string, SuggestionLineReview>>(() => {
    return allCards.reduce<Record<string, SuggestionLineReview>>((acc, card) => {
      acc[card.id] = reviewDraftSuggestionLine(card, normalizedContext);
      return acc;
    }, {});
  }, [allCards, normalizedContext]);
  const structureReview = useMemo(() => {
    if (!suggestions) {
      return null;
    }
    return buildFullStructureReview(ostData, suggestions, normalizedContext);
  }, [normalizedContext, ostData, suggestions]);

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
        <p className="mt-2 text-xs text-slate-500">
          Line-by-line auto-review and improved recommendations will appear here after generation.
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
            Draft cards extracted from imported notes. Each line is auto-reviewed with improved
            wording, comments, and recommendations.
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
            onClick={() => {
              const reviewedCards = selectedCards.map((card) => {
                const review = lineReviews[card.id];
                if (!review) {
                  return card;
                }
                return {
                  ...card,
                  title: review.improvedLine,
                  evidence: review.recommendedQuote ?? card.evidence,
                };
              });
              onApplySelected(reviewedCards, structureReview?.applySeeds);
            }}
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
          lineReviews={lineReviews}
        />
        <SuggestionSection
          title="Draft solutions"
          subtitle="Potential solution concepts inferred from action-oriented notes."
          cardClassName="border-[#D7CEFF] bg-[#EEEAFE]"
          items={suggestions.solutions}
          isSelected={isSelected}
          onToggle={toggleSelection}
          lineReviews={lineReviews}
        />
        <SuggestionSection
          title="Draft assumptions"
          subtitle="Beliefs and hypotheses requiring validation."
          cardClassName="border-[#F4CADC] bg-[#FDECF3]"
          items={suggestions.assumptions}
          isSelected={isSelected}
          onToggle={toggleSelection}
          lineReviews={lineReviews}
        />
      </div>

      {structureReview ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Complete OST structure check (all required parts)
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Includes Outcome, Opportunity Spaces, Big Opportunities, Smaller Opportunities /
              Problems (with plain italic quote), Solutions, and Assumptions. Blank levels are
              auto-filled with recommended ideas based on note context.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <StructureSection title="Outcome" lines={structureReview.outcome} />
            <StructureSection
              title="Opportunity Spaces"
              lines={structureReview.opportunitySpaces}
            />
            <StructureSection title="Big Opportunities" lines={structureReview.bigOpportunities} />
            <StructureSection
              title="Smaller Opportunities / Problems"
              lines={structureReview.smallerOpportunities}
            />
            <StructureSection title="Solutions" lines={structureReview.solutions} />
            <StructureSection title="Assumptions" lines={structureReview.assumptions} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
