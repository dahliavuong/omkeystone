import type { OSTAIReviewInput, OSTAIReviewResult } from '../types/aiReview';

const SYSTEM_PROMPT = `
You are an experienced Business Analyst, Product Strategist, and Discovery Lead.
Review the proposed OST against project context from raw notes.
Be critical but constructive, business-focused, and precise.
`.trim();

export const buildOstReviewPrompt = (input: OSTAIReviewInput): string => {
  return `
You are an experienced Business Analyst, Product Strategist, and Discovery Lead. Review the Opportunity Solution Tree (OST) I propose for a client and evaluate whether it truly resonates with the project context.

Your task is to assess the quality, relevance, and strategic fit of the OST against the following context inputs from raw note:
* Project background
* Problem statement
* Business case / rationale
* Current challenges / pain points
* Target future state
* Strategic goals / outcomes
* Customer or user needs
* Constraints, assumptions, and dependencies

Please perform the evaluation in a structured way.

1. Context Understanding
   First, summarize your understanding of:
* The business context
* The core problem(s) this project is trying to solve
* Why this matters to the client
* The intended future state or business outcomes

2. OST Evaluation
   Evaluate the proposed OST across these dimensions:
* Alignment to business problem
* Alignment to business case
* Relevance to current challenges
* Fit to future state
* Logical structure
* Completeness
* Clarity
* Prioritization readiness
* Strategic coherence
* Risk of solution bias

3. Gap Analysis
   Identify:
* Misalignments between the OST and the project context
* Missing opportunities or weak branches
* Opportunity statements that are too broad, vague, duplicated, or solution-led
* Solutions that do not clearly trace back to validated opportunities
* Assumptions that need validation but are not stated
* Any branch that may not resonate with executive stakeholders or business users, and why

4. Recommendations
   Provide practical recommendations to improve the OST, including:
* What should be rewritten
* What should be added
* What should be merged or removed
* How to make the opportunity statements more meaningful and evidence-based
* How to better connect the tree to business value and future-state outcomes
* How to strengthen prioritization and stakeholder buy-in

5. Improved Version
   Where possible, suggest a revised version of:
* The outcome statement
* Opportunity space
* Big Opportunity statements
* Smaller Opportunity statements
* Solution areas
* Assumptions / validation questions

6. Output Format
Please provide:
A. Overall Assessment
B. Strengths
C. Gaps / Concerns
D. Recommendations
E. Suggested Improved each statement

Important guidance:
* Be critical but constructive
* Do not just validate the OST at face value
* Prioritize business relevance over wording
* Flag generic or solution-driven logic
* Keep recommendations suitable for client-facing advisory context

After section E, provide this final machine-readable block exactly:
Refined Preview Template:
Outcome: <text>
- Opps space 1: <text>
    - Big opp 1: <text>
        - Small opp 1: <text>
            - Quote: _"<text>"_
            - Solution 1: <text>
                - Assumption 1: <text>
                - Assumption 2: <text>
            - Solution 2: <text>
        - Small opp 2: <text>
            - Quote: _"<text>"_
            - Solution 1: <text>
                - Assumption 1: <text>
    - Big opp 2: <text>
    - Big opp 3: <text>
- Opps space 2: <text>
    - Big opp 1: <text>
    - Big opp 2: <text>
    - Big opp 3: <text>

If any part is blank in the draft, recommend content based on context.

Project Context:
${input.projectContext}

Draft OST Preview:
${input.proposedOst}
`.trim();
};

const firstSentence = (text: string, fallback: string): string => {
  const sentence =
    text
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .find((part) => part.length > 24) ?? fallback;
  return sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence;
};

const fillTemplate = (context: string, draft: string): string => {
  const nonEmpty = draft
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const getValue = (prefixPattern: RegExp, fallback: string): string => {
    const line = nonEmpty.find((item) => prefixPattern.test(item));
    const value = line?.replace(prefixPattern, '').trim() ?? '';
    return value || fallback;
  };

  const contextBased = firstSentence(context, 'improve measurable business outcomes');

  return [
    `Outcome: ${getValue(/^Outcome:\s*/i, contextBased)}`,
    `- Opps space 1: ${getValue(/^-+\s*Opps?\s*space\s*1:\s*/i, 'Customer journey and experience')}`,
    `    - Big opp 1: ${getValue(/^-+\s*Big\s*opp\s*1:\s*/i, 'Resolve highest-impact journey friction')}`,
    `        - Small opp 1: ${getValue(/^-+\s*Small\s*opp\s*1:\s*/i, 'Users face a critical problem in current flow')}`,
    `            - Quote: ${getValue(/^-+\s*Quote\s*:\s*/i, '_"Users struggle in the current journey due to key friction points."_')}`,
    `            - Solution 1: ${getValue(/^-+\s*Solution\s*1:\s*/i, 'Pilot a focused intervention')}`,
    `                - Assumption 1: ${getValue(/^-+\s*Assumption\s*1:\s*/i, 'Users will adopt the improved flow')}`,
    `                - Assumption 2: ${getValue(/^-+\s*Assumption\s*2:\s*/i, 'Execution is feasible within constraints')}`,
    `            - Solution 2: ${getValue(/^-+\s*Solution\s*2:\s*/i, 'Introduce a secondary support mechanism')}`,
    `        - Small opp 2: ${getValue(/^-+\s*Small\s*opp\s*2:\s*/i, 'Secondary user/business problem cluster')}`,
    `            - Quote: ${getValue(/^-+\s*Quote\s*:\s*/i, '_"Current process blockers reduce confidence and throughput."_')}`,
    `            - Solution 1: ${getValue(/^-+\s*Solution\s*1:\s*/i, 'Deliver an incremental quick-win')}`,
    `                - Assumption 1: ${getValue(/^-+\s*Assumption\s*1:\s*/i, 'The quick-win has measurable impact')}`,
    `    - Big opp 2: ${getValue(/^-+\s*Big\s*opp\s*2:\s*/i, 'Improve supporting capabilities')}`,
    `    - Big opp 3: ${getValue(/^-+\s*Big\s*opp\s*3:\s*/i, 'Reduce systemic blockers and risks')}`,
    `- Opps space 2: ${getValue(/^-+\s*Opps?\s*space\s*2:\s*/i, 'Operations and enablement')}`,
    `    - Big opp 1: ${getValue(/^-+\s*Big\s*opp\s*1:\s*/i, 'Strengthen execution alignment')}`,
    `    - Big opp 2: ${getValue(/^-+\s*Big\s*opp\s*2:\s*/i, 'Improve delivery throughput')}`,
    `    - Big opp 3: ${getValue(/^-+\s*Big\s*opp\s*3:\s*/i, 'De-risk adoption and change management')}`,
  ].join('\n');
};

const runOfflineReview = (input: OSTAIReviewInput): OSTAIReviewResult => {
  const report = fillTemplate(input.projectContext, input.proposedOst);

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
      return runOfflineReview(input);
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
