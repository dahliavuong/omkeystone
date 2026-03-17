import type { OSTAIReviewInput, OSTAIReviewResult } from '../types/aiReview';

const SYSTEM_PROMPT = `
You are an experienced Business Analyst, Product Strategist, and Discovery Lead.
Evaluate the provided Opportunity Solution Tree (OST) against the provided project context.
Be critical but constructive, practical, and business-focused.
Challenge weak logic and generic assumptions.
Prefer business relevance over wording quality.
`.trim();

export const buildOstReviewPrompt = (input: OSTAIReviewInput): string => {
  return `
Act as a senior Business Analyst and discovery advisor reviewing GENERATED OST SUGGESTIONS for a client.

Primary task:
- Review the suggestions line by line and improve them one by one in the same sequence.
- Keep the response as one continuous flow (do not split into separate analysis sections).
- Ensure the improved version includes all required OST levels:
  Outcome, Opportunity Spaces, Big Opportunities, Smaller Opportunities / Problems (with plain italic quote), Solutions, Assumptions.
- If any level is blank, propose a concrete recommendation for that level based on the original notes context.

Required output format:
1) [Level] Original: ...
   Improved: ...
   Reason: ...
2) [Level] Original: ...
   Improved: ...
   Reason: ...
...

After the numbered line-by-line review, include one final block:
Improved OST (single integrated version):
- Outcome: ...
- Opportunity Spaces: ...
- Big Opportunities: ...
- Smaller Opportunities / Problems (with plain italic quote): ...
- Solutions: ...
- Assumptions: ...

Project Context:
${input.projectContext}

Proposed OST:
${input.proposedOst}
`.trim();
};

type LineLevel =
  | 'Outcome'
  | 'Opportunity Spaces'
  | 'Big Opportunities'
  | 'Smaller Opportunities / Problems'
  | 'Solutions'
  | 'Assumptions';

type ParsedLine = {
  level: LineLevel;
  original: string;
};

const REQUIRED_LEVELS: LineLevel[] = [
  'Outcome',
  'Opportunity Spaces',
  'Big Opportunities',
  'Smaller Opportunities / Problems',
  'Solutions',
  'Assumptions',
];

const sectionHeaderToLevel = (line: string): LineLevel | null => {
  const normalized = line.toLowerCase().replace(/[:\s]/g, '');
  if (normalized.startsWith('outcome')) return 'Outcome';
  if (normalized.startsWith('opportunityspaces')) return 'Opportunity Spaces';
  if (normalized.startsWith('bigopportunities')) return 'Big Opportunities';
  if (normalized.startsWith('smalleropportunities/problems'))
    return 'Smaller Opportunities / Problems';
  if (normalized.startsWith('smalleropportunities')) return 'Smaller Opportunities / Problems';
  if (normalized.startsWith('solutions')) return 'Solutions';
  if (normalized.startsWith('assumptions')) return 'Assumptions';
  return null;
};

const extractLines = (proposedOst: string): ParsedLine[] => {
  const parsed: ParsedLine[] = [];
  let currentLevel: LineLevel | null = null;

  for (const rawLine of proposedOst.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerLevel = sectionHeaderToLevel(line);
    if (headerLevel) {
      currentLevel = headerLevel;
      continue;
    }

    if (!currentLevel) {
      continue;
    }

    const isContentLine =
      /^[-*]/.test(line) ||
      /^\d+(\.\d+)*[.)]?\s+/.test(line) ||
      line.toLowerCase().startsWith('quote:');

    if (!isContentLine) {
      continue;
    }

    parsed.push({
      level: currentLevel,
      original: line.replace(/^[-*]\s*/, '').trim(),
    });
  }

  const hasLevel = new Set(parsed.map((item) => item.level));
  for (const level of REQUIRED_LEVELS) {
    if (!hasLevel.has(level)) {
      parsed.push({ level, original: '(blank)' });
    }
  }

  return parsed;
};

const contextHint = (context: string, fallback: string): string => {
  const firstSentence =
    context
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .find((part) => part.length > 30) ?? fallback;
  return firstSentence.length > 140 ? `${firstSentence.slice(0, 137)}...` : firstSentence;
};

const improveLine = (line: ParsedLine, context: string): string => {
  const source = line.original;
  const sourceIsBlank = !source || source === '(blank)' || source === '(none yet)';

  if (line.level === 'Outcome') {
    return sourceIsBlank
      ? `Increase measurable business value by addressing key note-derived pains: ${contextHint(context, 'improve user and business outcomes')}`
      : source;
  }

  if (line.level === 'Opportunity Spaces') {
    return sourceIsBlank
      ? 'Customer journey and operational enablement'
      : source.replace(/^(\d+(\.\d+)*)\s*/, '');
  }

  if (line.level === 'Big Opportunities') {
    return sourceIsBlank ? 'Unified cross-functional opportunity themes' : source;
  }

  if (line.level === 'Smaller Opportunities / Problems') {
    if (source.toLowerCase().startsWith('quote:')) {
      return source.replace(/^quote:\s*/i, '_').concat('_');
    }
    return sourceIsBlank
      ? `Problem: unclear pain pattern from notes. _"${contextHint(context, 'Users report friction in current journeys.')}"_`
      : source;
  }

  if (line.level === 'Solutions') {
    return sourceIsBlank ? 'Run a focused pilot solution mapped to top-priority problem' : source;
  }

  return sourceIsBlank
    ? 'Assume proposed solution can deliver measurable impact; validate with a lightweight experiment'
    : source;
};

const runOfflineReview = (input: OSTAIReviewInput): OSTAIReviewResult => {
  const context = input.projectContext;
  const lines = extractLines(input.proposedOst);
  const improved = lines.map((line) => ({
    ...line,
    improved: improveLine(line, context),
  }));

  const items = improved.map(
    (item, index) =>
      `${index + 1}) [${item.level}] Original: ${item.original}\n   Improved: ${item.improved}\n   Reason: ${
        item.original === '(blank)' || item.original === '(none yet)'
          ? 'Original content is blank, so a context-based recommendation was proposed.'
          : 'Improved for clearer business relevance and stronger OST wording.'
      }`,
  );

  const collectLevel = (level: LineLevel): string[] =>
    improved
      .filter((item) => item.level === level)
      .map((item) => item.improved)
      .filter((value) => value && value !== '(blank)');

  const report = `
${items.join('\n\n')}

Improved OST (single integrated version):
- Outcome: ${collectLevel('Outcome')[0] ?? 'Increase measurable business value from note-derived priority opportunities'}
- Opportunity Spaces: ${collectLevel('Opportunity Spaces').slice(0, 3).join(' | ') || 'Customer journey and operational enablement'}
- Big Opportunities: ${collectLevel('Big Opportunities').slice(0, 4).join(' | ') || 'Unified cross-functional opportunity themes'}
- Smaller Opportunities / Problems (with plain italic quote): ${collectLevel('Smaller Opportunities / Problems').slice(0, 4).join(' | ') || 'Problem: unclear pain pattern from notes. _"Users report friction in current journeys."_'}
- Solutions: ${collectLevel('Solutions').slice(0, 4).join(' | ') || 'Run a focused pilot solution mapped to top-priority problem'}
- Assumptions: ${collectLevel('Assumptions').slice(0, 4).join(' | ') || 'Assume proposed solution can deliver measurable impact; validate with a lightweight experiment'}
`.trim();

  return {
    ok: true,
    model: 'offline-advisory-reviewer',
    mode: 'offline',
    report,
  };
};

export const runOstAiReview = async (
  input: OSTAIReviewInput,
): Promise<OSTAIReviewResult> => {
  const env = import.meta.env;
  const apiKey =
    (env.VITE_OST_LLM_API_KEY as string | undefined) ||
    (env.VITE_LLM_API_KEY as string | undefined);
  const model =
    (env.VITE_OST_LLM_MODEL as string | undefined) ||
    (env.VITE_LLM_MODEL as string | undefined) ||
    'gpt-4o-mini';
  const explicitApiUrl =
    (env.VITE_OST_LLM_API_URL as string | undefined) ||
    (env.VITE_LLM_API_URL as string | undefined);
  const baseUrl =
    (env.VITE_OST_LLM_BASE_URL as string | undefined) ||
    (env.VITE_LLM_BASE_URL as string | undefined) ||
    'https://api.openai.com/v1';
  const apiUrl = explicitApiUrl ?? `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  if (!apiKey) {
    return runOfflineReview(input);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildOstReviewPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        message: `AI request failed (${response.status}). ${errorText || 'Please retry.'}`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const report = payload.choices?.[0]?.message?.content?.trim();

    if (!report) {
      return {
        ok: false,
        message: 'AI response was empty. Please retry with richer context and OST details.',
      };
    }

    return {
      ok: true,
      report,
      model,
      mode: 'llm',
    };
  } catch {
    return runOfflineReview(input);
  }
};
