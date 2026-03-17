import type { OSTData } from '../types/ost';
import type { GeneratedOSTSuggestions } from '../types/ostSuggestion';
import type { ApplyStructureSeeds } from './ostDraft';
import { reviewDraftSuggestionLine } from './suggestionReview';

export type StructureLineReview = {
  original: string;
  improved: string;
  comment: string;
  recommendation: string;
};

export type FullStructureReview = {
  outcome: StructureLineReview[];
  opportunitySpaces: StructureLineReview[];
  bigOpportunities: StructureLineReview[];
  smallerOpportunities: StructureLineReview[];
  solutions: StructureLineReview[];
  assumptions: StructureLineReview[];
  applySeeds: ApplyStructureSeeds;
};

const getContextHint = (context: string): string => {
  const sentence =
    context
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .find((part) => part.length > 24) ?? 'notes-derived business priorities';
  return sentence.length > 100 ? `${sentence.slice(0, 97)}...` : sentence;
};

const topKeywords = (context: string): string[] => {
  const stopWords = new Set([
    'about',
    'their',
    'there',
    'which',
    'would',
    'could',
    'should',
    'while',
    'where',
    'with',
    'from',
    'have',
    'this',
    'that',
    'they',
    'into',
    'being',
    'across',
    'users',
    'customer',
    'business',
  ]);
  const scores = new Map<string, number>();
  context
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 5 && !stopWords.has(token))
    .forEach((token) => scores.set(token, (scores.get(token) ?? 0) + 1));

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([token]) => token);
};

const toLine = (
  original: string,
  improved: string,
  comment: string,
  recommendation: string,
): StructureLineReview => ({
  original,
  improved,
  comment,
  recommendation,
});

export const buildFullStructureReview = (
  ostData: OSTData,
  suggestions: GeneratedOSTSuggestions,
  context: string,
): FullStructureReview => {
  const contextHint = getContextHint(context);
  const keywords = topKeywords(context);

  const outcomeOriginal = ostData.outcome?.trim() || '(blank)';
  const outcomeImproved =
    outcomeOriginal === '(blank)'
      ? `Improve measurable business outcomes by solving priority pain points in ${contextHint}`
      : outcomeOriginal;

  const opportunitySpaceOriginals = ostData.opportunitySpaces.map((space) => space.title);
  const opportunitySpaces =
    opportunitySpaceOriginals.length > 0
      ? opportunitySpaceOriginals.map((title) =>
          toLine(
            title,
            title,
            'Opportunity space already exists.',
            'Ensure this space has a clear owner and measurable outcomes.',
          ),
        )
      : [
          toLine(
            '(blank)',
            `Customer and stakeholder journeys (${keywords[0] ?? 'engagement'})`,
            'Opportunity space is missing.',
            'Create a top-level space anchored to user and stakeholder journey problems.',
          ),
          toLine(
            '(blank)',
            `Operational enablement and delivery (${keywords[1] ?? 'integration'})`,
            'Second opportunity space is missing.',
            'Add an operations-focused space to capture process and capability blockers.',
          ),
        ];

  const bigOriginals = ostData.opportunitySpaces.flatMap((space) =>
    space.bigOpportunities.map((big) => big.title),
  );
  const bigOpportunities =
    bigOriginals.length > 0
      ? bigOriginals.map((title) =>
          toLine(
            title,
            title,
            'Big opportunity already exists.',
            'Validate whether this big opportunity is broad enough to group related smaller problems.',
          ),
        )
      : [
          toLine(
            '(blank)',
            `Friction reduction in ${keywords[0] ?? 'core journeys'}`,
            'Big opportunity layer is missing.',
            'Define a major theme tied to the highest pain-point cluster.',
          ),
          toLine(
            '(blank)',
            `Value realization through ${keywords[1] ?? 'cross-functional'} enablement`,
            'Second big opportunity is missing.',
            'Add a complementary theme connected to operational/business value unlocks.',
          ),
        ];

  const smallerOpportunities =
    suggestions.opportunities.length > 0
      ? suggestions.opportunities.map((card) => {
          const reviewed = reviewDraftSuggestionLine(
            { ...card, category: 'opportunity' },
            contextHint,
          );
          return toLine(card.title, reviewed.improvedLine, reviewed.comment, reviewed.recommendation);
        })
      : [
          toLine(
            '(blank)',
            `Problem: users face avoidable friction across ${keywords[0] ?? 'critical'} journeys`,
            'No smaller opportunities were detected from notes.',
            `Add at least 2-3 concrete problems from notes. Context hint: ${contextHint}`,
          ),
        ];

  const solutions =
    suggestions.solutions.length > 0
      ? suggestions.solutions.map((card) => {
          const reviewed = reviewDraftSuggestionLine({ ...card, category: 'solution' }, contextHint);
          return toLine(card.title, reviewed.improvedLine, reviewed.comment, reviewed.recommendation);
        })
      : [
          toLine(
            '(blank)',
            `Pilot targeted intervention to address top problem in ${keywords[0] ?? 'journey flow'}`,
            'No solution directions were detected.',
            'Propose testable solution directions mapped to each top-priority smaller opportunity.',
          ),
        ];

  const assumptions =
    suggestions.assumptions.length > 0
      ? suggestions.assumptions.map((card) => {
          const reviewed = reviewDraftSuggestionLine(
            { ...card, category: 'assumption' },
            contextHint,
          );
          return toLine(card.title, reviewed.improvedLine, reviewed.comment, reviewed.recommendation);
        })
      : [
          toLine(
            '(blank)',
            'We assume prioritized interventions can be delivered within current constraints and dependencies',
            'No assumptions were detected.',
            'Add explicit validation questions per solution (feasibility, adoption, measurable impact).',
          ),
        ];

  return {
    outcome: [
      toLine(
        outcomeOriginal,
        outcomeImproved,
        outcomeOriginal === '(blank)' ? 'Outcome was blank and has been recommended.' : 'Outcome exists.',
        'Ensure outcome includes a measurable business KPI and timeframe.',
      ),
    ],
    opportunitySpaces,
    bigOpportunities,
    smallerOpportunities,
    solutions,
    assumptions,
    applySeeds: {
      outcome: outcomeImproved,
      opportunitySpaceTitle: opportunitySpaces[0]?.improved,
      bigOpportunityTitle: bigOpportunities[0]?.improved,
    },
  };
};
