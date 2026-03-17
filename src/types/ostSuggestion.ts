export type SuggestionCategory = 'opportunity' | 'solution' | 'assumption';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export type DraftSuggestionCard = {
  id: string;
  category: SuggestionCategory;
  title: string;
  evidence: string;
  confidence: SuggestionConfidence;
};

export type GeneratedOSTSuggestions = {
  sourceNoteId: string;
  generatedAt: string;
  opportunities: DraftSuggestionCard[];
  solutions: DraftSuggestionCard[];
  assumptions: DraftSuggestionCard[];
};
