import type { ImportedNote } from '../types/noteImport';
import type {
  DraftSuggestionCard,
  GeneratedOSTSuggestions,
  SuggestionCategory,
  SuggestionConfidence,
} from '../types/ostSuggestion';

const CATEGORY_KEYWORDS: Record<SuggestionCategory, string[]> = {
  opportunity: [
    'opportunity',
    'problem',
    'pain',
    'pain point',
    'friction',
    'gap',
    'need',
    'challenge',
    'cannot',
    "can't",
    'hard to',
    'difficult',
    'drop-off',
    'complaint',
  ],
  solution: [
    'solution',
    'build',
    'create',
    'launch',
    'implement',
    'enable',
    'improve',
    'offer',
    'automate',
    'integrate',
    'bundle',
    'pilot',
    'experiment',
  ],
  assumption: [
    'assumption',
    'assume',
    'we believe',
    'hypothesis',
    'if we',
    'likely',
    'expected',
    'depends on',
    'we think',
  ],
};

const PREFIX_PATTERNS: Record<SuggestionCategory, RegExp> = {
  opportunity: /^\s*(opportunity|problem|pain|issue|challenge)\s*[:\-]/i,
  solution: /^\s*(solution|idea|initiative|action|proposal)\s*[:\-]/i,
  assumption: /^\s*(assumption|hypothesis|belief|risk)\s*[:\-]/i,
};

const normalizeLine = (line: string): string => {
  return line
    .replace(/^[\-\*\u2022\d\.\)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitLines = (content: string): string[] => {
  return content
    .split(/\r?\n+/)
    .map((line) => normalizeLine(line))
    .filter((line) => line.length >= 16);
};

const toCanonicalKey = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
};

const withDraftPrefix = (category: SuggestionCategory, title: string): string => {
  if (category === 'opportunity') {
    return title;
  }
  if (category === 'solution') {
    return title.startsWith('Draft:') ? title : `Draft: ${title}`;
  }
  return title.startsWith('Assume') || title.startsWith('We assume')
    ? title
    : `We assume ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
};

const clampTitle = (line: string): string => {
  if (line.length <= 120) {
    return line;
  }
  return `${line.slice(0, 117)}...`;
};

const classifyLine = (line: string): { category: SuggestionCategory; confidence: SuggestionConfidence } => {
  const lower = line.toLowerCase();

  for (const [category, pattern] of Object.entries(PREFIX_PATTERNS) as Array<
    [SuggestionCategory, RegExp]
  >) {
    if (pattern.test(line)) {
      return { category, confidence: 'high' };
    }
  }

  const scores: Record<SuggestionCategory, number> = {
    opportunity: 0,
    solution: 0,
    assumption: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [SuggestionCategory, string[]]
  >) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category] += 1;
      }
    }
  }

  let bestCategory: SuggestionCategory = 'opportunity';
  let bestScore = scores.opportunity;
  for (const category of ['solution', 'assumption'] as SuggestionCategory[]) {
    if (scores[category] > bestScore) {
      bestCategory = category;
      bestScore = scores[category];
    }
  }

  if (bestScore >= 2) {
    return { category: bestCategory, confidence: 'medium' };
  }

  if (bestScore === 1) {
    return { category: bestCategory, confidence: 'low' };
  }

  if (/\b(should|need to|must|can)\b/i.test(line)) {
    return { category: 'solution', confidence: 'low' };
  }

  if (/\b(assume|believe|if)\b/i.test(line)) {
    return { category: 'assumption', confidence: 'low' };
  }

  return { category: 'opportunity', confidence: 'low' };
};

const makeCard = (
  category: SuggestionCategory,
  confidence: SuggestionConfidence,
  line: string,
): DraftSuggestionCard => {
  const cleaned = line.replace(PREFIX_PATTERNS[category], '').trim();
  const candidate = clampTitle(cleaned || line);

  return {
    id: crypto.randomUUID(),
    category,
    confidence,
    title: withDraftPrefix(category, candidate),
    evidence: line,
  };
};

const takeTop = (items: DraftSuggestionCard[], maxItems: number): DraftSuggestionCard[] => {
  const confidenceRank: Record<SuggestionConfidence, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  return [...items]
    .sort((a, b) => confidenceRank[b.confidence] - confidenceRank[a.confidence])
    .slice(0, maxItems);
};

export const generateOSTSuggestionsFromImportedNote = (
  note: ImportedNote,
): GeneratedOSTSuggestions => {
  const lines = splitLines(note.content);
  const seen = new Set<string>();
  const opportunities: DraftSuggestionCard[] = [];
  const solutions: DraftSuggestionCard[] = [];
  const assumptions: DraftSuggestionCard[] = [];

  for (const line of lines) {
    const dedupeKey = toCanonicalKey(line);
    if (!dedupeKey || seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const { category, confidence } = classifyLine(line);
    const card = makeCard(category, confidence, line);

    if (category === 'opportunity') {
      opportunities.push(card);
    } else if (category === 'solution') {
      solutions.push(card);
    } else {
      assumptions.push(card);
    }
  }

  return {
    sourceNoteId: note.id,
    generatedAt: new Date().toISOString(),
    opportunities: takeTop(opportunities, 8),
    solutions: takeTop(solutions, 8),
    assumptions: takeTop(assumptions, 8),
  };
};
