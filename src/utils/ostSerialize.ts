import type { OSTData } from '../types/ost';
import type { GeneratedOSTSuggestions } from '../types/ostSuggestion';

export const serializeOstForReview = (data: OSTData): string => {
  const lines: string[] = [];
  lines.push('Outcome:');
  lines.push(data.outcome?.trim() ? `- ${data.outcome.trim()}` : '- (not set)');
  lines.push('');
  lines.push('Opportunity spaces and branches:');

  if (data.opportunitySpaces.length === 0) {
    lines.push('- (none yet)');
    return lines.join('\n');
  }

  data.opportunitySpaces.forEach((space, spaceIndex) => {
    lines.push(`${spaceIndex + 1}. Opportunity Space: ${space.title}`);

    if (space.bigOpportunities.length === 0) {
      lines.push('   - Big opportunities: (none)');
      return;
    }

    space.bigOpportunities.forEach((bigOpportunity, bigIndex) => {
      lines.push(`   ${spaceIndex + 1}.${bigIndex + 1} Big opportunity: ${bigOpportunity.title}`);

      if (bigOpportunity.smallerOpportunities.length === 0) {
        lines.push('      - Smaller opportunities: (none)');
        return;
      }

      bigOpportunity.smallerOpportunities.forEach((smallerOpportunity, smallIndex) => {
        lines.push(
          `      ${spaceIndex + 1}.${bigIndex + 1}.${smallIndex + 1} Smaller opportunity: ${smallerOpportunity.title}`,
        );
        if (smallerOpportunity.quote.trim()) {
          lines.push(`         Quote: ${smallerOpportunity.quote.trim()}`);
        }

        if (smallerOpportunity.solutions.length === 0) {
          lines.push('         - Solutions: (none)');
          return;
        }

        smallerOpportunity.solutions.forEach((solution, solutionIndex) => {
          lines.push(
            `         ${spaceIndex + 1}.${bigIndex + 1}.${smallIndex + 1}.${solutionIndex + 1} Solution: ${solution.title}`,
          );

          if (solution.assumptions.length === 0) {
            lines.push('            - Assumptions: (none)');
            return;
          }

          solution.assumptions.forEach((assumption, assumptionIndex) => {
            lines.push(
              `            ${spaceIndex + 1}.${bigIndex + 1}.${smallIndex + 1}.${solutionIndex + 1}.${assumptionIndex + 1} Assumption: ${assumption.text}`,
            );
          });
        });
      });
    });
  });

  return lines.join('\n');
};

export const serializeGeneratedSuggestionsForReview = (
  suggestions: GeneratedOSTSuggestions,
  currentOst: OSTData,
): string => {
  const lines: string[] = [];

  lines.push('Generated OST suggestions (line-by-line source):');
  lines.push('');

  lines.push('Outcome:');
  lines.push(currentOst.outcome?.trim() ? `- ${currentOst.outcome.trim()}` : '- (blank)');
  lines.push('');

  lines.push('Opportunity Spaces:');
  if (currentOst.opportunitySpaces.length === 0) {
    lines.push('- (blank)');
  } else {
    currentOst.opportunitySpaces.forEach((space, index) => {
      lines.push(`${index + 1}. ${space.title}`);
    });
  }
  lines.push('');

  lines.push('Big Opportunities:');
  const bigTitles = currentOst.opportunitySpaces.flatMap((space) =>
    space.bigOpportunities.map((big) => big.title),
  );
  if (bigTitles.length === 0) {
    lines.push('- (blank)');
  } else {
    bigTitles.forEach((title, index) => {
      lines.push(`${index + 1}. ${title}`);
    });
  }
  lines.push('');

  lines.push('Smaller Opportunities / Problems (with plain italic quote):');
  if (suggestions.opportunities.length === 0) {
    lines.push('- (blank)');
  } else {
    suggestions.opportunities.forEach((opportunity, index) => {
      lines.push(`${index + 1}. ${opportunity.title}`);
      lines.push(`   quote: ${opportunity.evidence}`);
    });
  }
  lines.push('');

  lines.push('Solutions:');
  if (suggestions.solutions.length === 0) {
    lines.push('- (blank)');
  } else {
    suggestions.solutions.forEach((solution, index) => {
      lines.push(`${index + 1}. ${solution.title}`);
    });
  }
  lines.push('');

  lines.push('Assumptions:');
  if (suggestions.assumptions.length === 0) {
    lines.push('- (blank)');
  } else {
    suggestions.assumptions.forEach((assumption, index) => {
      lines.push(`${index + 1}. ${assumption.title}`);
    });
  }

  return lines.join('\n');
};
