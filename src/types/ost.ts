export type Assumption = {
  id: string;
  text: string;
};

export type Solution = {
  id: string;
  title: string;
  assumptions: Assumption[];
};

export type SmallerOpportunity = {
  id: string;
  quote: string;
  title: string;
  solutions: Solution[];
};

export type BigOpportunity = {
  id: string;
  title: string;
  smallerOpportunities: SmallerOpportunity[];
};

export type OpportunitySpace = {
  id: string;
  title: string;
  bigOpportunities: BigOpportunity[];
};

export type OSTData = {
  outcome: string;
  opportunitySpaces: OpportunitySpace[];
};
