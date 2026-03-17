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
Act as a senior Business Analyst and discovery advisor reviewing an Opportunity Solution Tree (OST) prepared for a client.

Use the provided project context as the source of truth, including:
- Project background
- Problem statement
- Business case / rationale
- Current challenges / pain points
- Target future state
- Strategic goals / outcomes
- Customer or user needs
- Constraints, assumptions, and dependencies

Evaluate whether:
- the outcome is meaningful and tied to business value
- the opportunities are rooted in real user/business problems
- the tree reflects the client's actual context rather than generic assumptions
- the structure is logical and complete
- the solution branches are traceable and not prematurely biased
- the assumptions are explicit and testable
- the OST is strong enough to support prioritization, stakeholder alignment, and next-step decision making

Please provide the response in this exact structure:

A. Overall Assessment
- Overall resonance with project context: High / Medium / Low
- Short explanation

B. Strengths
- List the strongest parts of the current OST

C. Gaps / Concerns
- List key issues, weaknesses, or misalignments

D. Recommendations
- Clear, actionable recommendations

E. Suggested Improved OST
- Revised outcome
- Revised opportunities
- Revised solution directions
- Revised assumptions / questions to validate

Project Context:
${input.projectContext}

Proposed OST:
${input.proposedOst}
`.trim();
};

const containsAny = (text: string, terms: string[]): boolean => {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
};

const countHits = (text: string, terms: string[]): number => {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => (lower.includes(term) ? count + 1 : count), 0);
};

const inferResonance = (context: string, ost: string): 'High' | 'Medium' | 'Low' => {
  const contextTerms = context
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 4);
  const uniqueTerms = [...new Set(contextTerms)].slice(0, 60);
  const overlap = uniqueTerms.filter((term) => ost.toLowerCase().includes(term)).length;

  if (overlap >= 12) {
    return 'High';
  }
  if (overlap >= 6) {
    return 'Medium';
  }
  return 'Low';
};

const runOfflineReview = (input: OSTAIReviewInput): OSTAIReviewResult => {
  const context = input.projectContext;
  const ost = input.proposedOst;
  const resonance = inferResonance(context, ost);

  const hasOutcome = containsAny(ost, ['outcome']);
  const hasOpportunities = containsAny(ost, ['opportunity']);
  const hasSolutions = containsAny(ost, ['solution']);
  const hasAssumptions = containsAny(ost, ['assumption']);
  const hasPainPointSignals = countHits(context, [
    'pain',
    'challenge',
    'friction',
    'problem',
    'blocker',
  ]);
  const hasFutureStateSignals = countHits(context, ['future state', 'target state', 'north star']);
  const hasGoalSignals = countHits(context, ['goal', 'outcome', 'kpi', 'business value']);
  const hasConstraintSignals = countHits(context, [
    'constraint',
    'dependency',
    'risk',
    'assumption',
  ]);
  const solutionBiasRisk =
    countHits(ost, ['solution', 'build', 'implement', 'launch']) >
    countHits(ost, ['opportunity', 'problem', 'pain']);

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  if (hasOutcome) strengths.push('The OST includes an explicit outcome anchor.');
  else concerns.push('Outcome statement is missing or unclear.');

  if (hasOpportunities) strengths.push('Opportunity framing is present in the tree.');
  else concerns.push('Opportunity layer appears weak or absent.');

  if (hasSolutions) strengths.push('Solution directions are documented and actionable.');
  else concerns.push('Solution directions are missing, making prioritization difficult.');

  if (hasAssumptions) strengths.push('Assumptions are at least partially explicit.');
  else concerns.push('Assumptions are not explicit, which weakens validation planning.');

  if (hasPainPointSignals < 2) {
    concerns.push('Project context does not clearly articulate current pain points/blockers.');
    recommendations.push(
      'Strengthen context evidence with concrete pain points, affected users, and impact metrics.',
    );
  }

  if (hasFutureStateSignals === 0) {
    concerns.push('Target future state is under-specified.');
    recommendations.push(
      'Define a sharper future-state narrative and connect each major branch to it.',
    );
  }

  if (hasGoalSignals === 0) {
    concerns.push('Business goals/outcomes are not explicit enough for prioritization.');
    recommendations.push(
      'Add measurable business outcomes (e.g., retention, conversion, wallet share, cycle-time).',
    );
  }

  if (hasConstraintSignals === 0) {
    concerns.push('Constraints/dependencies are weakly represented.');
    recommendations.push(
      'Explicitly state major constraints and dependencies next to relevant assumptions.',
    );
  }

  if (solutionBiasRisk) {
    concerns.push('Tree may be solution-biased relative to opportunity evidence.');
    recommendations.push(
      'Rebalance by rewriting opportunities as user/business problems before finalizing solutions.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Prioritize top 3 opportunity branches using impact x confidence x feasibility scoring.',
    );
  }

  const report = `
A. Overall Assessment
- Overall resonance with project context: ${resonance}
- Short explanation: This offline advisory review estimates resonance from context-to-OST signal overlap and structural completeness checks.

B. Strengths
${strengths.map((item) => `- ${item}`).join('\n') || '- No material strengths detected from current input.'}

C. Gaps / Concerns
${concerns.map((item) => `- ${item}`).join('\n') || '- No major structural concerns detected, but deeper stakeholder validation is still recommended.'}

D. Recommendations
${recommendations.map((item) => `- ${item}`).join('\n')}

E. Suggested Improved OST
- Revised outcome:
  - Define one measurable business outcome statement tied to value (e.g., growth, retention, efficiency).
- Revised opportunities:
  - Rewrite opportunities as specific user/business problems with evidence source and affected segment.
- Revised solution directions:
  - Keep solution areas broad and testable, mapped one-to-many against validated opportunities.
- Revised assumptions / questions to validate:
  - For each solution, add explicit assumptions, confidence level, and the fastest validation method.
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
