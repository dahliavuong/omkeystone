import type { OSTData } from '../types/ost';

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
