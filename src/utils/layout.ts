import type { OSTData } from '../types/ost';

export const LEVEL_TITLES = [
  'Outcome',
  'Opportunity Spaces',
  'Big opportunities',
  'Smaller opportunities',
  'Solutions',
  'Assumptions',
] as const;

export const getNodeId = {
  outcome: () => 'outcome',
  opportunitySpace: (spaceId: string) => `space-${spaceId}`,
  bigOpportunity: (spaceId: string, bigId: string) => `big-${spaceId}-${bigId}`,
  smallerOpportunity: (spaceId: string, bigId: string, smallId: string) =>
    `small-${spaceId}-${bigId}-${smallId}`,
  solution: (
    spaceId: string,
    bigId: string,
    smallId: string,
    solutionId: string,
  ) => `solution-${spaceId}-${bigId}-${smallId}-${solutionId}`,
  assumption: (
    spaceId: string,
    bigId: string,
    smallId: string,
    solutionId: string,
    assumptionId: string,
  ) => `assumption-${spaceId}-${bigId}-${smallId}-${solutionId}-${assumptionId}`,
};

export const getMaxBigOpportunities = (data: OSTData): number =>
  Math.max(
    ...data.opportunitySpaces.map((space) => space.bigOpportunities.length),
    1,
  );
