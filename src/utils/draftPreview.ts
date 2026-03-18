import { generateOSTSuggestionsFromText } from './ostSuggestion';

type BuildDraftOptions = {
  fillMissing: boolean;
};

type RefinementResult = {
  preview: string;
  mode: 'offline';
};

const clean = (value: string): string =>
  value.replace(/^draft:\s*/i, '').replace(/^we assume\s*/i, '').trim();

const firstSentence = (text: string): string => {
  const sentence =
    text
      .replace(/\r/g, ' ')
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .find((part) => part.length > 24) ?? '';
  return sentence.length > 110 ? `${sentence.slice(0, 107)}...` : sentence;
};

const topTerms = (text: string): string[] => {
  const stopWords = new Set([
    'about',
    'their',
    'there',
    'which',
    'would',
    'could',
    'should',
    'while',
    'where',
    'with',
    'from',
    'have',
    'this',
    'that',
    'they',
    'into',
    'being',
    'across',
    'users',
    'customer',
    'business',
  ]);

  const scores = new Map<string, number>();
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 5 && !stopWords.has(token))
    .forEach((token) => scores.set(token, (scores.get(token) ?? 0) + 1));

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([token]) => token);
};

const nextValue = (
  values: string[],
  cursor: { value: number },
  fallback: string,
  options: BuildDraftOptions,
): string => {
  const value = values[cursor.value];
  cursor.value += 1;
  if (value) {
    return clean(value);
  }
  return options.fillMissing ? fallback : '';
};

export const buildDraftOstPreviewFromRawNote = (
  rawNote: string,
  options: BuildDraftOptions,
): string => {
  const suggestions = generateOSTSuggestionsFromText(rawNote, 'preview');
  const opportunityTitles = suggestions.opportunities.map((item) => clean(item.title));
  const solutionTitles = suggestions.solutions.map((item) => clean(item.title));
  const assumptionTitles = suggestions.assumptions.map((item) => clean(item.title));
  const terms = topTerms(rawNote);

  const oppCursor = { value: 0 };
  const solCursor = { value: 0 };
  const assCursor = { value: 0 };

  const outcome =
    firstSentence(rawNote) ||
    (options.fillMissing ? 'Improve measurable outcomes based on imported notes' : '');

  const oppSpace1 = options.fillMissing
    ? `Customer and stakeholder journeys (${terms[0] ?? 'engagement'})`
    : '';
  const oppSpace2 = options.fillMissing
    ? `Operations and enablement (${terms[1] ?? 'execution'})`
    : '';

  const lines: string[] = [];
  lines.push(`Outcome: ${outcome}`);
  lines.push(`- Opps space 1: ${oppSpace1}`);
  lines.push(
    `    - Big opp 1: ${nextValue(opportunityTitles, oppCursor, 'Improve primary journey friction', options)}`,
  );
  lines.push(
    `        - Small opp 1: ${nextValue(opportunityTitles, oppCursor, 'Specific user or business problem', options)}`,
  );
  lines.push(
    `            - Solution 1: ${nextValue(solutionTitles, solCursor, 'Pilot targeted intervention', options)}`,
  );
  lines.push(
    `                - Assumption 1: ${nextValue(assumptionTitles, assCursor, 'Adoption risk can be managed', options)}`,
  );
  lines.push(
    `                - Assumption 2: ${nextValue(assumptionTitles, assCursor, 'Execution is feasible in constraints', options)}`,
  );
  lines.push(
    `            - Solution 2: ${nextValue(solutionTitles, solCursor, 'Secondary solution direction', options)}`,
  );
  lines.push(
    `        - Small opp 2: ${nextValue(opportunityTitles, oppCursor, 'Another concrete problem statement', options)}`,
  );
  lines.push(
    `            - Solution 1: ${nextValue(solutionTitles, solCursor, 'Focused quick-win solution', options)}`,
  );
  lines.push(
    `                - Assumption 1: ${nextValue(assumptionTitles, assCursor, 'Expected impact is measurable', options)}`,
  );
  lines.push(
    `    - Big opp 2: ${nextValue(opportunityTitles, oppCursor, 'Improve enabling capability', options)}`,
  );
  lines.push(
    `    - Big opp 3: ${nextValue(opportunityTitles, oppCursor, 'Reduce systemic blockers', options)}`,
  );
  lines.push(`- Opps space 2: ${oppSpace2}`);
  lines.push(
    `    - Big opp 1: ${nextValue(opportunityTitles, oppCursor, 'Expand value realization', options)}`,
  );
  lines.push(
    `    - Big opp 2: ${nextValue(opportunityTitles, oppCursor, 'Strengthen cross-team alignment', options)}`,
  );
  lines.push(
    `    - Big opp 3: ${nextValue(opportunityTitles, oppCursor, 'De-risk delivery and adoption', options)}`,
  );

  return lines.join('\n');
};

export const refineDraftOstPreview = async (
  rawNote: string,
  currentDraftPreview: string,
): Promise<RefinementResult> => {
  const hasBlank = /:\s*$/.test(currentDraftPreview);
  if (!hasBlank) {
    return { preview: currentDraftPreview, mode: 'offline' };
  }

  return {
    preview: buildDraftOstPreviewFromRawNote(rawNote, { fillMissing: true }),
    mode: 'offline',
  };
};
