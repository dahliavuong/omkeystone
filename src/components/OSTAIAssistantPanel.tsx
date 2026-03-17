import { useMemo, useState } from 'react';
import type { OSTAIReviewInput } from '../types/aiReview';
import type { OSTData } from '../types/ost';
import { buildOstReviewPrompt, runOstAiReview } from '../utils/aiReview';
import { serializeOstForReview } from '../utils/ostSerialize';

type OSTAIAssistantPanelProps = {
  ostData: OSTData;
};

type Status = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const statusClasses: Record<Status['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};

const buildInput = (projectContext: string, proposedOst: string): OSTAIReviewInput => ({
  projectContext: projectContext.trim(),
  proposedOst: proposedOst.trim(),
});

export function OSTAIAssistantPanel({ ostData }: OSTAIAssistantPanelProps) {
  const currentOstSnapshot = useMemo(() => serializeOstForReview(ostData), [ostData]);
  const [projectContext, setProjectContext] = useState('');
  const [proposedOst, setProposedOst] = useState(currentOstSnapshot);
  const [reviewOutput, setReviewOutput] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const isReadyToRun = projectContext.trim().length > 0 && proposedOst.trim().length > 0;

  const handleCopyPrompt = async () => {
    const prompt = buildOstReviewPrompt(buildInput(projectContext, proposedOst));
    await navigator.clipboard.writeText(prompt);
    setStatus({
      type: 'info',
      message:
        'Evaluation prompt copied. You can paste it into any LLM if in-app API is not configured.',
    });
  };

  const handleRun = async () => {
    if (!isReadyToRun) {
      setStatus({
        type: 'error',
        message: 'Project context and proposed OST are both required before running the review.',
      });
      return;
    }

    setIsRunning(true);
    setStatus({
      type: 'info',
      message: 'Running AI resonance review...',
    });

    const result = await runOstAiReview(buildInput(projectContext, proposedOst));
    setIsRunning(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message,
      });
      return;
    }

    setReviewOutput(result.report);
    setStatus({
      type: result.mode === 'offline' ? 'info' : 'success',
      message:
        result.mode === 'offline'
          ? 'Generated review in offline advisory mode (no API key required).'
          : `AI review generated successfully using model: ${result.model}`,
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            AI Assistant (Preview): OST Resonance Review
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Evaluate whether the proposed OST resonates with project context in a client-facing
            advisory format.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProposedOst(currentOstSnapshot)}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Load current OST
          </button>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Copy prompt
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={!isReadyToRun || isRunning}
            className="rounded-md bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {isRunning ? 'Running review...' : 'Run AI review'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-900" htmlFor="project-context">
            Project context
          </label>
          <p className="mt-1 text-xs text-slate-600">
            Include background, problem statement, business case, pain points, future state, goals,
            user needs, constraints, assumptions, dependencies.
          </p>
          <textarea
            id="project-context"
            value={projectContext}
            onChange={(event) => setProjectContext(event.target.value)}
            rows={10}
            placeholder="Paste project context here..."
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-900" htmlFor="proposed-ost">
            Proposed OST
          </label>
          <p className="mt-1 text-xs text-slate-600">
            Use your current board snapshot or paste an alternative OST proposal.
          </p>
          <textarea
            id="proposed-ost"
            value={proposedOst}
            onChange={(event) => setProposedOst(event.target.value)}
            rows={10}
            placeholder="Paste proposed OST here..."
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {status ? (
        <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${statusClasses[status.type]}`}>
          {status.message}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">AI review output</p>
        <p className="mt-1 text-xs text-slate-600">
          Output follows: Overall Assessment, Strengths, Gaps/Concerns, Recommendations, Suggested
          Improved OST.
        </p>
        <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
          {reviewOutput || 'No AI review generated yet.'}
        </pre>
      </div>
    </section>
  );
}
