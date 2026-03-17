import { useMemo, useState } from 'react';
import type { OSTData } from '../types/ost';
import type { DraftSuggestionCard } from '../types/ostSuggestion';
import type { GeneratedOSTSuggestions, SuggestionConfidence } from '../types/ostSuggestion';
import { buildOstReviewPrompt, runOstAiReview } from '../utils/aiReview';
import {
  serializeGeneratedSuggestionsForReview,
  serializeOstForReview,
} from '../utils/ostSerialize';

type OSTSuggestionsPanelProps = {
  suggestions: GeneratedOSTSuggestions | null;
  onApplySelected: (selectedCards: DraftSuggestionCard[]) => void;
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

export function OSTSuggestionsPanel({
  suggestions,
  onApplySelected,
  ostData,
  projectContext,
}: OSTSuggestionsPanelProps) {
  const statusClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  } as const;

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
  const [aiStatus, setAiStatus] = useState<{
    type: keyof typeof statusClasses;
    message: string;
  } | null>(null);
  const [aiOutput, setAiOutput] = useState('');
  const [isAiRunning, setIsAiRunning] = useState(false);

  const isSelected = (id: string): boolean => selectionOverrides[id] ?? true;

  const selectedCards = allCards.filter((item) => isSelected(item.id));
  const proposedOst = useMemo(() => {
    if (suggestions) {
      return serializeGeneratedSuggestionsForReview(suggestions, ostData);
    }
    return serializeOstForReview(ostData);
  }, [ostData, suggestions]);
  const normalizedContext =
    projectContext.trim() ||
    'No explicit project context provided. Evaluate based on the current OST and available note-derived signals.';

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

  const handleCopyAiPrompt = async () => {
    const prompt = buildOstReviewPrompt({
      projectContext: normalizedContext,
      proposedOst,
    });
    try {
      await navigator.clipboard.writeText(prompt);
      setAiStatus({
        type: 'info',
        message: 'AI review prompt copied to clipboard.',
      });
    } catch {
      setAiStatus({
        type: 'error',
        message: 'Unable to copy prompt from this browser session.',
      });
    }
  };

  const handleRunAiReview = async () => {
    setIsAiRunning(true);
    setAiStatus({ type: 'info', message: 'Running AI resonance review...' });
    const result = await runOstAiReview({
      projectContext: normalizedContext,
      proposedOst,
    });
    setIsAiRunning(false);

    if (!result.ok) {
      setAiStatus({ type: 'error', message: result.message });
      return;
    }

    setAiOutput(result.report);
    setAiStatus({
      type: result.mode === 'offline' ? 'info' : 'success',
      message:
        result.mode === 'offline'
          ? 'Generated review in offline advisory mode.'
          : `AI review generated successfully using model: ${result.model}`,
    });
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
          AI resonance review will appear here after suggestions are generated.
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              AI Assistant: Resonance review
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Embedded review of OST relevance and strategic fit based on imported notes and current
              tree.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAiPrompt}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Copy prompt
            </button>
            <button
              type="button"
              onClick={handleRunAiReview}
              disabled={isAiRunning}
              className="rounded-md bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400"
            >
              {isAiRunning ? 'Running review...' : 'Run AI review'}
            </button>
          </div>
        </div>

        {aiStatus ? (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-xs ${statusClasses[aiStatus.type]}`}
          >
            {aiStatus.message}
          </div>
        ) : null}

        <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
          {aiOutput || 'No AI review generated yet.'}
        </pre>
      </div>
    </section>
  );
}
