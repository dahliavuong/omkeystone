import type { OpportunitySpace } from '../types/ost';
import { getNodeId } from '../utils/layout';
import { LevelRow } from './LevelRow';
import { OSTCard } from './OSTCard';

type TreeBranchProps = {
  opportunitySpace: OpportunitySpace;
  registerNode: (id: string, element: HTMLDivElement | null) => void;
};

export function TreeBranch({ opportunitySpace, registerNode }: TreeBranchProps) {
  const bigColumnCount = Math.max(opportunitySpace.bigOpportunities.length, 1);

  return (
    <article className="flex w-[1120px] flex-col items-center gap-8">
      <OSTCard
        title={opportunitySpace.title}
        subtitle="Opportunity space"
        variant="opportunitySpace"
        className="w-[360px] text-center"
        nodeId={getNodeId.opportunitySpace(opportunitySpace.id)}
        registerNode={registerNode}
      />

      <LevelRow title="Big opportunities">
        <div
          className="grid items-start gap-8"
          style={{ gridTemplateColumns: `repeat(${bigColumnCount}, minmax(0, 1fr))` }}
        >
          {opportunitySpace.bigOpportunities.map((bigOpportunity) => (
            <div key={bigOpportunity.id} className="flex w-[350px] flex-col gap-5">
              <OSTCard
                title={bigOpportunity.title}
                subtitle="Big opportunity"
                variant="bigOpportunity"
                nodeId={getNodeId.bigOpportunity(opportunitySpace.id, bigOpportunity.id)}
                registerNode={registerNode}
              />

              <LevelRow title="Smaller opportunities">
                <div className="space-y-5">
                  {bigOpportunity.smallerOpportunities.map((smallerOpportunity) => (
                    <div key={smallerOpportunity.id} className="space-y-3">
                      <OSTCard
                        title={smallerOpportunity.title}
                        italicQuote={smallerOpportunity.quote}
                        variant="smallerOpportunity"
                        nodeId={getNodeId.smallerOpportunity(
                          opportunitySpace.id,
                          bigOpportunity.id,
                          smallerOpportunity.id,
                        )}
                        registerNode={registerNode}
                      />

                      <LevelRow title="Solutions">
                        <div
                          className="grid items-start gap-3"
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(smallerOpportunity.solutions.length, 1)}, minmax(0, 1fr))`,
                          }}
                        >
                          {smallerOpportunity.solutions.map((solution) => (
                            <div key={solution.id} className="space-y-2">
                              <OSTCard
                                title={solution.title}
                                variant="solution"
                                className="min-h-20"
                                nodeId={getNodeId.solution(
                                  opportunitySpace.id,
                                  bigOpportunity.id,
                                  smallerOpportunity.id,
                                  solution.id,
                                )}
                                registerNode={registerNode}
                              />

                              <LevelRow title="Assumptions">
                                <div className="space-y-2">
                                  {solution.assumptions.map((assumption) => (
                                    <OSTCard
                                      key={assumption.id}
                                      title={assumption.text}
                                      variant="assumption"
                                      className="min-h-14"
                                      nodeId={getNodeId.assumption(
                                        opportunitySpace.id,
                                        bigOpportunity.id,
                                        smallerOpportunity.id,
                                        solution.id,
                                        assumption.id,
                                      )}
                                      registerNode={registerNode}
                                    />
                                  ))}
                                </div>
                              </LevelRow>
                            </div>
                          ))}
                        </div>
                      </LevelRow>
                    </div>
                  ))}
                </div>
              </LevelRow>
            </div>
          ))}
        </div>
      </LevelRow>
    </article>
  );
}
