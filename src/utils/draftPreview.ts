import { generateOSTSuggestionsFromText } from './ostSuggestion';
import { runOstAiReview } from './aiReview';
import type { OSTData } from '../types/ost';

type BuildDraftOptions = {
  fillMissing: boolean;
};

type RefinementResult = {
  preview: string;
  mode: 'offline' | 'llm';
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
    `            - Quote: ${nextValue(opportunityTitles, oppCursor, '_"User pain-point statement from notes."_', options)}`,
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
    `            - Quote: ${nextValue(opportunityTitles, oppCursor, '_"Second pain-point statement from notes."_', options)}`,
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
  const aiResult = await runOstAiReview({
    projectContext: rawNote,
    proposedOst: currentDraftPreview,
  });

  if (aiResult.ok) {
    const parsedFromReview = extractPreviewFromAiReport(aiResult.report);
    if (parsedFromReview) {
      return { preview: parsedFromReview, mode: aiResult.mode };
    }
  }

  return {
    preview: buildDraftOstPreviewFromRawNote(rawNote, { fillMissing: true }),
    mode: 'offline',
  };
};

const extractPreviewFromAiReport = (report: string): string | null => {
  const normalized = report.replace(/\r/g, '');
  const allLines = normalized.split('\n');
  const markerIndex = allLines.findIndex((line) =>
    /Refined Preview Template\s*:/i.test(line.trim()),
  );
  const searchStart = markerIndex >= 0 ? markerIndex + 1 : 0;
  const outcomeIndex =
    allLines.findIndex((line, index) => index >= searchStart && /^Outcome\s*:/i.test(line.trim()));

  if (outcomeIndex === -1) {
    return null;
  }

  const allowedLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) {
      return false;
    }
    return (
      /^Outcome\s*:/i.test(trimmed) ||
      /^-\s*Opps?\s*space/i.test(trimmed) ||
      /^-\s*Big\s*opp/i.test(trimmed) ||
      /^-\s*Small\s*opp/i.test(trimmed) ||
      /^-\s*Quote\s*:/i.test(trimmed) ||
      /^-\s*Solution/i.test(trimmed) ||
      /^-\s*Assumption/i.test(trimmed)
    );
  };

  const previewLines: string[] = [];
  for (let i = outcomeIndex; i < allLines.length; i += 1) {
    const line = allLines[i];
    if (allowedLine(line)) {
      previewLines.push(line);
      continue;
    }
    if (previewLines.length > 0 && line.trim() === '') {
      break;
    }
  }

  if (previewLines.length < 4) {
    return null;
  }

  return previewLines.join('\n');
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);

const makeId = (prefix: string, title: string): string => {
  const normalized = slug(title) || 'item';
  return `${prefix}-${normalized}-${crypto.randomUUID().slice(0, 6)}`;
};

const extractValue = (line: string, pattern: RegExp): string => {
  const match = line.match(pattern);
  return match?.[1]?.trim() ?? '';
};

const cleanQuote = (value: string): string => {
  return value.replace(/^_+/, '').replace(/_+$/, '').trim();
};

export const parseDraftPreviewToOstData = (preview: string): OSTData => {
  const lines = preview
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const outcomeLine = lines.find((line) => /^Outcome\s*:/i.test(line)) ?? '';
  const outcome = extractValue(outcomeLine, /^Outcome\s*:\s*(.*)$/i);

  const data: OSTData = {
    outcome: outcome || 'Outcome not defined',
    opportunitySpaces: [],
  };

  let currentSpace: OSTData['opportunitySpaces'][number] | null = null;
  let currentBig: OSTData['opportunitySpaces'][number]['bigOpportunities'][number] | null = null;
  let currentSmall:
    | OSTData['opportunitySpaces'][number]['bigOpportunities'][number]['smallerOpportunities'][number]
    | null = null;
  let currentSolution:
    | OSTData['opportunitySpaces'][number]['bigOpportunities'][number]['smallerOpportunities'][number]['solutions'][number]
    | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^Outcome\s*:/i.test(line)) {
      continue;
    }

    const oppSpaceTitle = extractValue(line, /^-\s*Opps?\s*space\s*\d*\s*:\s*(.*)$/i);
    if (oppSpaceTitle || /^-\s*Opps?\s*space/i.test(line)) {
      currentSpace = {
        id: makeId('space', oppSpaceTitle || 'Opportunity Space'),
        title: oppSpaceTitle || 'Opportunity Space',
        bigOpportunities: [],
      };
      data.opportunitySpaces.push(currentSpace);
      currentBig = null;
      currentSmall = null;
      currentSolution = null;
      continue;
    }

    const bigTitle = extractValue(line, /^-\s*Big\s*opp\s*\d*\s*:\s*(.*)$/i);
    if (bigTitle || /^-\s*Big\s*opp/i.test(line)) {
      if (!currentSpace) {
        currentSpace = {
          id: makeId('space', 'Opportunity Space'),
          title: 'Opportunity Space',
          bigOpportunities: [],
        };
        data.opportunitySpaces.push(currentSpace);
      }
      currentBig = {
        id: makeId('big', bigTitle || 'Big Opportunity'),
        title: bigTitle || 'Big Opportunity',
        smallerOpportunities: [],
      };
      currentSpace.bigOpportunities.push(currentBig);
      currentSmall = null;
      currentSolution = null;
      continue;
    }

    const smallTitle = extractValue(line, /^-\s*Small\s*opp\s*\d*\s*:\s*(.*)$/i);
    if (smallTitle || /^-\s*Small\s*opp/i.test(line)) {
      if (!currentSpace) {
        currentSpace = {
          id: makeId('space', 'Opportunity Space'),
          title: 'Opportunity Space',
          bigOpportunities: [],
        };
        data.opportunitySpaces.push(currentSpace);
      }
      if (!currentBig) {
        currentBig = {
          id: makeId('big', 'Big Opportunity'),
          title: 'Big Opportunity',
          smallerOpportunities: [],
        };
        currentSpace.bigOpportunities.push(currentBig);
      }
      currentSmall = {
        id: makeId('small', smallTitle || 'Smaller Opportunity'),
        title: smallTitle || 'Smaller Opportunity',
        quote: '',
        solutions: [],
      };
      currentBig.smallerOpportunities.push(currentSmall);
      currentSolution = null;
      continue;
    }

    const quoteText = extractValue(line, /^-\s*Quote\s*:\s*(.*)$/i);
    if (quoteText || /^-\s*Quote\s*:/i.test(line)) {
      if (currentSmall) {
        currentSmall.quote = cleanQuote(quoteText) || currentSmall.quote;
      }
      continue;
    }

    const solutionTitle = extractValue(line, /^-\s*Solution\s*\d*\s*:\s*(.*)$/i);
    if (solutionTitle || /^-\s*Solution/i.test(line)) {
      if (!currentSpace) {
        currentSpace = {
          id: makeId('space', 'Opportunity Space'),
          title: 'Opportunity Space',
          bigOpportunities: [],
        };
        data.opportunitySpaces.push(currentSpace);
      }
      if (!currentBig) {
        currentBig = {
          id: makeId('big', 'Big Opportunity'),
          title: 'Big Opportunity',
          smallerOpportunities: [],
        };
        currentSpace.bigOpportunities.push(currentBig);
      }
      if (!currentSmall) {
        currentSmall = {
          id: makeId('small', 'Smaller Opportunity'),
          title: 'Smaller Opportunity',
          quote: '',
          solutions: [],
        };
        currentBig.smallerOpportunities.push(currentSmall);
      }
      currentSolution = {
        id: makeId('solution', solutionTitle || 'Solution'),
        title: solutionTitle || 'Solution',
        assumptions: [],
      };
      currentSmall.solutions.push(currentSolution);
      continue;
    }

    const assumptionTitle = extractValue(line, /^-\s*Assumption\s*\d*\s*:\s*(.*)$/i);
    if (assumptionTitle || /^-\s*Assumption/i.test(line)) {
      if (!currentSpace) {
        currentSpace = {
          id: makeId('space', 'Opportunity Space'),
          title: 'Opportunity Space',
          bigOpportunities: [],
        };
        data.opportunitySpaces.push(currentSpace);
      }
      if (!currentBig) {
        currentBig = {
          id: makeId('big', 'Big Opportunity'),
          title: 'Big Opportunity',
          smallerOpportunities: [],
        };
        currentSpace.bigOpportunities.push(currentBig);
      }
      if (!currentSmall) {
        currentSmall = {
          id: makeId('small', 'Smaller Opportunity'),
          title: 'Smaller Opportunity',
          quote: '',
          solutions: [],
        };
        currentBig.smallerOpportunities.push(currentSmall);
      }
      if (!currentSolution) {
        currentSolution = {
          id: makeId('solution', 'Solution'),
          title: 'Solution',
          assumptions: [],
        };
        currentSmall.solutions.push(currentSolution);
      }
      currentSolution.assumptions.push({
        id: makeId('assumption', assumptionTitle || 'Assumption'),
        text: assumptionTitle || 'Assumption',
      });
    }
  }

  if (data.opportunitySpaces.length === 0) {
    data.opportunitySpaces.push({
      id: makeId('space', 'Opportunity Space'),
      title: 'Opportunity Space',
      bigOpportunities: [],
    });
  }

  return data;
};
