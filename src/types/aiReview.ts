export type OSTAIReviewInput = {
  projectContext: string;
  proposedOst: string;
};

export type OSTAIReviewConfig = {
  apiKey?: string;
  model?: string;
  apiUrl?: string;
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
