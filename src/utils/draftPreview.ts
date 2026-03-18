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

const fallbackLabel = (value: string, fallback: string): string => {
  const normalized = value.trim();
  return normalized || fallback;
};

const splitPipeList = (value: string): string[] =>
  value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const extractPreviewFromAiReport = (report: string): string | null => {
  const outcomeMatch = report.match(/- Outcome:\s*(.+)/i);
  const spaceMatch = report.match(/- Opportunity Spaces:\s*(.+)/i);
  const bigMatch = report.match(/- Big Opportunities:\s*(.+)/i);
  const smallMatch = report.match(/- Smaller Opportunities \/ Problems(?: \(with plain italic quote\))?:\s*(.+)/i);
  const solutionMatch = report.match(/- Solutions:\s*(.+)/i);
  const assumptionMatch = report.match(/- Assumptions:\s*(.+)/i);

  if (!outcomeMatch && !spaceMatch && !bigMatch) {
    return null;
  }

  const outcome = fallbackLabel(outcomeMatch?.[1] ?? '', '');
  const spaces = splitPipeList(spaceMatch?.[1] ?? '');
  const bigOpps = splitPipeList(bigMatch?.[1] ?? '');
  const smallOpps = splitPipeList(smallMatch?.[1] ?? '');
  const solutions = splitPipeList(solutionMatch?.[1] ?? '');
  const assumptions = splitPipeList(assumptionMatch?.[1] ?? '');

  const lines: string[] = [];
  lines.push(`Outcome: ${outcome}`);
  lines.push(`- Opps space 1: ${spaces[0] ?? ''}`);
  lines.push(`    - Big opp 1: ${bigOpps[0] ?? ''}`);
  lines.push(`        - Small opp 1: ${smallOpps[0] ?? ''}`);
  lines.push(`            - Solution 1: ${solutions[0] ?? ''}`);
  lines.push(`                - Assumption 1: ${assumptions[0] ?? ''}`);
  lines.push(`                - Assumption 2: ${assumptions[1] ?? ''}`);
  lines.push(`            - Solution 2: ${solutions[1] ?? ''}`);
  lines.push(`        - Small opp 2: ${smallOpps[1] ?? ''}`);
  lines.push(`            - Solution 1: ${solutions[2] ?? ''}`);
  lines.push(`                - Assumption 1: ${assumptions[2] ?? ''}`);
  lines.push(`    - Big opp 2: ${bigOpps[1] ?? ''}`);
  lines.push(`    - Big opp 3: ${bigOpps[2] ?? ''}`);
  lines.push(`- Opps space 2: ${spaces[1] ?? ''}`);
  lines.push(`    - Big opp 1: ${bigOpps[3] ?? ''}`);
  lines.push(`    - Big opp 2: ${bigOpps[4] ?? ''}`);
  lines.push(`    - Big opp 3: ${bigOpps[5] ?? ''}`);

  return lines.join('\n');
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
