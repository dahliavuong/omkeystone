import type { OSTData } from '../types/ost';
import { getNodeId } from './layout';

export type NodeConnection = {
  from: string;
  to: string;
};

export const buildConnections = (data: OSTData): NodeConnection[] => {
  const connections: NodeConnection[] = [];

  for (const space of data.opportunitySpaces) {
    const spaceNodeId = getNodeId.opportunitySpace(space.id);
    connections.push({
      from: getNodeId.outcome(),
      to: spaceNodeId,
    });

    for (const big of space.bigOpportunities) {
      const bigNodeId = getNodeId.bigOpportunity(space.id, big.id);
      connections.push({
        from: spaceNodeId,
        to: bigNodeId,
      });

      for (const small of big.smallerOpportunities) {
        const smallNodeId = getNodeId.smallerOpportunity(space.id, big.id, small.id);
        connections.push({
          from: bigNodeId,
          to: smallNodeId,
        });

        for (const solution of small.solutions) {
          const solutionNodeId = getNodeId.solution(
            space.id,
            big.id,
            small.id,
            solution.id,
          );
          connections.push({
            from: smallNodeId,
            to: solutionNodeId,
          });

          for (const assumption of solution.assumptions) {
            connections.push({
              from: solutionNodeId,
              to: getNodeId.assumption(
                space.id,
                big.id,
                small.id,
                solution.id,
                assumption.id,
              ),
            });
          }
        }
      }
    }
  }

  return connections;
};

export const buildOrthogonalPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string => {
  const middleY = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} V ${middleY} H ${x2} V ${y2}`;
};
