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

export const runOstAiReview = async (
  input: OSTAIReviewInput,
): Promise<OSTAIReviewResult> => {
  const apiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined;
  const model = (import.meta.env.VITE_LLM_MODEL as string | undefined) ?? 'gpt-4o-mini';
  const apiUrl =
    (import.meta.env.VITE_LLM_API_URL as string | undefined) ??
    'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    return {
      ok: false,
      missingApiKey: true,
      message:
        'AI API key is missing. Set VITE_LLM_API_KEY in your environment to run the in-app assistant.',
    };
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
    };
  } catch {
    return {
      ok: false,
      message:
        'Unable to connect to AI service. Check network access and API configuration, then retry.',
    };
  }
};
