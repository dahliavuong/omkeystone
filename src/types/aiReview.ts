export type OSTAIReviewInput = {
  projectContext: string;
  proposedOst: string;
};

export type OSTAIReviewResult =
  | {
      ok: true;
      report: string;
      model: string;
      mode: 'llm' | 'offline';
    }
  | {
      ok: false;
      message: string;
    };
