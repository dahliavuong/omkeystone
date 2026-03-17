import type { DraftSuggestionCard } from '../types/ostSuggestion';

export type SuggestionLineReview = {
  improvedLine: string;
  comment: string;
  recommendation: string;
  recommendedQuote?: string;
};

const summarizeContext = (context: string): string => {
  const candidate =
    context
      .split(/[.!?]\s+/)
      .map((line) => line.trim())
      .find((line) => line.length > 24) ?? 'key customer and business outcomes';

  return candidate.length > 110 ? `${candidate.slice(0, 107)}...` : candidate;
};

const removeDraftPrefix = (value: string): string => value.replace(/^draft:\s*/i, '').trim();

const ensureSentence = (value: string): string => {
  return /[.!?]$/.test(value) ? value : `${value}.`;
};

const improveOpportunity = (
  card: DraftSuggestionCard,
  contextSummary: string,
): SuggestionLineReview => {
  const title = removeDraftPrefix(card.title);
  const hasProblemSignal = /(problem|pain|friction|gap|challenge|drop-off|cannot|can't)/i.test(
    title,
  );
  const improvedLine = hasProblemSignal ? title : `Problem: ${title}`;
  const recommendedQuote = ensureSentence(card.evidence.replace(/^quote:\s*/i, ''));

  return {
    improvedLine,
    recommendedQuote,
    comment:
      'Reworded toward a user/business problem statement so the branch stays opportunity-led.',
    recommendation: `Link this problem to evidence and impact in context: ${contextSummary}`,
  };
};

const improveSolution = (
  card: DraftSuggestionCard,
  contextSummary: string,
): SuggestionLineReview => {
  const title = removeDraftPrefix(card.title);
  const hasActionVerb = /^(launch|build|enable|create|pilot|automate|integrate|introduce|design)\b/i.test(
    title,
  );
  const improvedLine = hasActionVerb ? title : `Pilot: ${title}`;

  return {
    improvedLine,
    comment: 'Adjusted to an action-oriented solution direction with clearer execution intent.',
    recommendation: `Map this solution to one target problem and expected value from context: ${contextSummary}`,
  };
};

const improveAssumption = (
  card: DraftSuggestionCard,
  contextSummary: string,
): SuggestionLineReview => {
  const title = removeDraftPrefix(card.title);
  const startsWithAssume = /^(we assume|assume)\b/i.test(title);
  const improvedLine = startsWithAssume ? title : `We assume ${title.charAt(0).toLowerCase()}${title.slice(1)}`;

  return {
    improvedLine,
    comment: 'Normalized as a testable assumption statement rather than a generic note.',
    recommendation: `Add a validation method and success metric tied to context: ${contextSummary}`,
  };
};

export const reviewDraftSuggestionLine = (
  card: DraftSuggestionCard,
  projectContext: string,
): SuggestionLineReview => {
  const contextSummary = summarizeContext(projectContext);

  if (card.category === 'opportunity') {
    return improveOpportunity(card, contextSummary);
  }

  if (card.category === 'solution') {
    return improveSolution(card, contextSummary);
  }

  return improveAssumption(card, contextSummary);
};
