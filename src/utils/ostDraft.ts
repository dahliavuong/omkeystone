import type { OSTData, SmallerOpportunity, Solution } from '../types/ost';
import type { DraftSuggestionCard } from '../types/ostSuggestion';

const toKey = (value: string): string => value.toLowerCase().replace(/\s+/g, ' ').trim();

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);

const createId = (prefix: string, seed: string): string => {
  const slug = toSlug(seed) || 'item';
  return `${prefix}-${slug}-${crypto.randomUUID().slice(0, 6)}`;
};

export const createBlankOSTData = (): OSTData => ({
  outcome: '',
  opportunitySpaces: [],
});

const ensureBaseBranch = (draft: OSTData) => {
  if (draft.opportunitySpaces.length === 0) {
    draft.opportunitySpaces.push({
      id: createId('space', 'imported-notes-space'),
      title: 'Imported Notes Space',
      bigOpportunities: [],
    });
  }

  const targetSpace = draft.opportunitySpaces[0];

  if (targetSpace.bigOpportunities.length === 0) {
    targetSpace.bigOpportunities.push({
      id: createId('big', 'generated-opportunities'),
      title: 'Generated opportunities',
      smallerOpportunities: [],
    });
  }

  return targetSpace.bigOpportunities[0];
};

const findSmallerOpportunityByTitle = (
  opportunities: SmallerOpportunity[],
  title: string,
): SmallerOpportunity | undefined => {
  const key = toKey(title);
  return opportunities.find((item) => toKey(item.title) === key);
};

const findSolutionByTitle = (solutions: Solution[], title: string): Solution | undefined => {
  const key = toKey(title);
  return solutions.find((item) => toKey(item.title) === key);
};

const ensureAttachmentOpportunity = (opportunities: SmallerOpportunity[]): SmallerOpportunity => {
  if (opportunities.length > 0) {
    return opportunities[0];
  }

  const generated: SmallerOpportunity = {
    id: createId('small', 'generated-opportunity'),
    quote: 'Inferred from imported notes',
    title: 'Generated opportunity from imported notes',
    solutions: [],
  };
  opportunities.push(generated);
  return generated;
};

const ensureAttachmentSolution = (opportunity: SmallerOpportunity): Solution => {
  if (opportunity.solutions.length > 0) {
    return opportunity.solutions[0];
  }

  const generated: Solution = {
    id: createId('solution', 'generated-solution'),
    title: 'Draft solution from notes',
    assumptions: [],
  };
  opportunity.solutions.push(generated);
  return generated;
};

export const applySelectedSuggestionsToOST = (
  current: OSTData,
  selectedCards: DraftSuggestionCard[],
): OSTData => {
  if (selectedCards.length === 0) {
    return current;
  }

  const next = structuredClone(current);
  if (!next.outcome.trim()) {
    next.outcome = 'Draft outcome from imported notes';
  }

  const targetBigOpportunity = ensureBaseBranch(next);
  const selectedOpportunities = selectedCards.filter((card) => card.category === 'opportunity');
  const selectedSolutions = selectedCards.filter((card) => card.category === 'solution');
  const selectedAssumptions = selectedCards.filter((card) => card.category === 'assumption');

  for (const opportunity of selectedOpportunities) {
    if (
      findSmallerOpportunityByTitle(targetBigOpportunity.smallerOpportunities, opportunity.title)
    ) {
      continue;
    }

    targetBigOpportunity.smallerOpportunities.push({
      id: createId('small', opportunity.title),
      quote: opportunity.evidence,
      title: opportunity.title,
      solutions: [],
    });
  }

  if (selectedSolutions.length > 0 || selectedAssumptions.length > 0) {
    ensureAttachmentOpportunity(targetBigOpportunity.smallerOpportunities);
  }

  selectedSolutions.forEach((solutionCard, index) => {
    const attachmentOpportunity =
      targetBigOpportunity.smallerOpportunities[
        index % targetBigOpportunity.smallerOpportunities.length
      ];

    if (findSolutionByTitle(attachmentOpportunity.solutions, solutionCard.title)) {
      return;
    }

    attachmentOpportunity.solutions.push({
      id: createId('solution', solutionCard.title),
      title: solutionCard.title,
      assumptions: [],
    });
  });

  if (selectedAssumptions.length === 0) {
    return next;
  }

  const solutionPool: Solution[] = [];
  for (const opportunity of targetBigOpportunity.smallerOpportunities) {
    if (opportunity.solutions.length === 0) {
      ensureAttachmentSolution(opportunity);
    }
    solutionPool.push(...opportunity.solutions);
  }

  selectedAssumptions.forEach((assumptionCard, index) => {
    const attachmentSolution = solutionPool[index % solutionPool.length];
    const assumptionExists = attachmentSolution.assumptions.some(
      (assumption) => toKey(assumption.text) === toKey(assumptionCard.title),
    );

    if (assumptionExists) {
      return;
    }

    attachmentSolution.assumptions.push({
      id: createId('assumption', assumptionCard.title),
      text: assumptionCard.title,
    });
  });

  return next;
};
