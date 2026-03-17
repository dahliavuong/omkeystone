export type OSTAIReviewInput = {
  projectContext: string;
  proposedOst: string;
};

export type OSTAIReviewResult =
  | {
      ok: true;
      report: string;
      model: string;
    }
  | {
      ok: false;
      message: string;
      missingApiKey?: boolean;
    };
