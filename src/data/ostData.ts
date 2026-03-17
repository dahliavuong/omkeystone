import type { OSTData } from '../types/ost';

export const ostData: OSTData = {
  outcome:
    'Maximise customer wallet share as they use the brands in our ecosystem',
  opportunitySpaces: [
    {
      id: 'omg',
      title: 'One Mount Group (OMG)',
      bigOpportunities: [
        {
          id: 'omre',
          title: 'OMRE',
          smallerOpportunities: [
            {
              id: 'home-discovery',
              quote:
                '“I can browse homes, but I cannot see financing and loyalty value in one place.”',
              title: 'Fragmented property discovery and financing journeys',
              solutions: [
                {
                  id: 'bundle-pre-approval',
                  title: 'Property listing + instant pre-approval bundle',
                  assumptions: [
                    {
                      id: 'tech-integration',
                      text: 'We assume OMRE and TCB APIs can provide near real-time eligibility checks.',
                    },
                    {
                      id: 'partner-sla',
                      text: 'We assume partner SLAs are sufficient for synchronous user flows.',
                    },
                  ],
                },
                {
                  id: 'location-loyalty',
                  title: 'Location-based loyalty incentives for viewings',
                  assumptions: [
                    {
                      id: 'merchant-density',
                      text: 'We assume merchant density is high enough in target districts.',
                    },
                  ],
                },
                {
                  id: 'advisor-assist',
                  title: 'AI advisor for budget-fit property shortlists',
                  assumptions: [
                    {
                      id: 'model-quality',
                      text: 'We assume recommendation quality is trusted after 2-3 interactions.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'ownership-lifecycle',
              quote:
                '“After buying a home, service needs are everywhere and disconnected.”',
              title: 'No cross-brand lifecycle support after purchase',
              solutions: [
                {
                  id: 'owner-journey',
                  title: 'Unified homeowner journey dashboard',
                  assumptions: [
                    {
                      id: 'single-sign-on',
                      text: 'We assume customers will use one identity across ecosystem products.',
                    },
                  ],
                },
                {
                  id: 'milestone-offers',
                  title: 'Milestone-based offers for renovation and moving',
                  assumptions: [
                    {
                      id: 'trigger-data',
                      text: 'We assume key ownership milestones can be captured accurately.',
                    },
                    {
                      id: 'offer-uplift',
                      text: 'We assume bundled offers produce measurable conversion uplift.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'omd',
          title: 'OMD',
          smallerOpportunities: [
            {
              id: 'grocery-personalization',
              quote:
                '“I receive too many generic promotions and ignore most of them.”',
              title: 'Low relevance in grocery promotions',
              solutions: [
                {
                  id: 'targeted-offers',
                  title: 'Cross-entity targeted offers engine',
                  assumptions: [
                    {
                      id: 'data-permission',
                      text: 'We assume customers consent to personalization using ecosystem data.',
                    },
                  ],
                },
                {
                  id: 'basket-reco',
                  title: 'AI-powered basket and replenishment recommendations',
                  assumptions: [
                    {
                      id: 'repeat-frequency',
                      text: 'We assume frequent buyers provide enough signal for recommendations.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'checkout-friction',
              quote:
                '“Checkout rewards are hard to understand, so I usually skip them.”',
              title: 'Checkout and loyalty redemption friction',
              solutions: [
                {
                  id: 'one-click-loyalty',
                  title: 'One-click loyalty redemption at checkout',
                  assumptions: [
                    {
                      id: 'wallet-adoption',
                      text: 'We assume at least half of active users adopt wallet-first checkout.',
                    },
                  ],
                },
                {
                  id: 'smart-incentive',
                  title: 'Smart incentive mix by basket value',
                  assumptions: [
                    {
                      id: 'margin-guardrails',
                      text: 'We assume margin guardrails can be encoded in pricing logic.',
                    },
                    {
                      id: 'incremental-sales',
                      text: 'We assume incentives shift average basket value upward.',
                    },
                  ],
                },
                {
                  id: 'family-plan',
                  title: 'Family plan bundles across grocery and finance',
                  assumptions: [
                    {
                      id: 'household-linking',
                      text: 'We assume household account linking is operationally feasible.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'omc',
          title: 'OMC',
          smallerOpportunities: [
            {
              id: 'mobility-payments',
              quote:
                '“I switch between ride apps and payment methods too often.”',
              title: 'Inconsistent mobility and payment experience',
              solutions: [
                {
                  id: 'personal-banking',
                  title: 'Personal banking wallet embedded in mobility app',
                  assumptions: [
                    {
                      id: 'app-engagement',
                      text: 'We assume daily mobility usage drives wallet habit formation.',
                    },
                  ],
                },
                {
                  id: 'commute-bundles',
                  title: 'Commute pass bundles with card benefits',
                  assumptions: [
                    {
                      id: 'bundle-appeal',
                      text: 'We assume bundled passes outperform individual promotions.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'trust-support',
              quote:
                '“When something goes wrong, I do not know which brand should solve it.”',
              title: 'Support ownership is unclear across brands',
              solutions: [
                {
                  id: 'single-helpdesk',
                  title: 'Single ecosystem helpdesk and case routing',
                  assumptions: [
                    {
                      id: 'ops-alignment',
                      text: 'We assume operations teams can agree on shared triage standards.',
                    },
                  ],
                },
                {
                  id: 'proactive-recovery',
                  title: 'Proactive service recovery with loyalty compensation',
                  assumptions: [
                    {
                      id: 'cx-nps-impact',
                      text: 'We assume proactive recovery improves NPS in measurable cohorts.',
                    },
                    {
                      id: 'cost-control',
                      text: 'We assume compensation budgets can be controlled by policy rules.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'cross-sell',
              quote:
                '“Relevant cross-sell offers are rare; most recommendations feel random.”',
              title: 'Weak contextual cross-selling in mobility touchpoints',
              solutions: [
                {
                  id: 'trip-moments',
                  title: 'Trip-moment offers for cards, insurance, and rewards',
                  assumptions: [
                    {
                      id: 'moment-precision',
                      text: 'We assume event timing can trigger offers without notification fatigue.',
                    },
                  ],
                },
                {
                  id: 'segment-playbooks',
                  title: 'Segment-specific cross-sell playbooks',
                  assumptions: [
                    {
                      id: 'segment-stability',
                      text: 'We assume key segments remain stable across seasonal periods.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'techcombank-group',
      title: 'Techcombank Group',
      bigOpportunities: [
        {
          id: 'tcb',
          title: 'TCB',
          smallerOpportunities: [
            {
              id: 'onboarding',
              quote:
                '“I can open an account quickly, but onboarding to ecosystem services is confusing.”',
              title: 'Bank onboarding does not transition into ecosystem journeys',
              solutions: [
                {
                  id: 'guided-journey',
                  title: 'Guided onboarding into top ecosystem use cases',
                  assumptions: [
                    {
                      id: 'journey-clarity',
                      text: 'We assume clear onboarding narratives reduce early churn.',
                    },
                  ],
                },
                {
                  id: 'goal-based-setup',
                  title: 'Goal-based setup with product bundles',
                  assumptions: [
                    {
                      id: 'bundle-fit',
                      text: 'We assume customers can self-select the right bundle with light guidance.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'everyday-engagement',
              quote:
                '“My banking app is transactional; it does not help with day-to-day lifestyle decisions.”',
              title: 'Low daily engagement beyond transactions',
              solutions: [
                {
                  id: 'lifestyle-hub',
                  title: 'Lifestyle hub linking grocery, mobility, and finance',
                  assumptions: [
                    {
                      id: 'feature-discoverability',
                      text: 'We assume in-app placement can drive repeat discovery of non-banking features.',
                    },
                    {
                      id: 'retention-impact',
                      text: 'We assume daily utility features improve 90-day retention.',
                    },
                  ],
                },
                {
                  id: 'spend-insights',
                  title: 'Spend insights with actionable next-best offers',
                  assumptions: [
                    {
                      id: 'insight-trust',
                      text: 'We assume customers trust automated categorization and insights.',
                    },
                  ],
                },
                {
                  id: 'shared-wallet',
                  title: 'Shared household wallet and allowance controls',
                  assumptions: [
                    {
                      id: 'household-demand',
                      text: 'We assume household financial management is a high-value unmet need.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'tcbs',
          title: 'TCBS',
          smallerOpportunities: [
            {
              id: 'investor-education',
              quote:
                '“I want to invest, but advice feels generic and disconnected from my goals.”',
              title: 'Limited contextual education for new investors',
              solutions: [
                {
                  id: 'ai-portfolio-coach',
                  title: 'AI portfolio coach for goal-based investing',
                  assumptions: [
                    {
                      id: 'compliance-safe',
                      text: 'We assume guidance can remain compliant while still feeling personalized.',
                    },
                  ],
                },
                {
                  id: 'learning-paths',
                  title: 'Milestone learning paths linked to product recommendations',
                  assumptions: [
                    {
                      id: 'learning-completion',
                      text: 'We assume short-form modules achieve meaningful completion rates.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'cross-entity-liquidity',
              quote:
                '“I cannot see how my cash, loans, and investments should work together.”',
              title: 'No unified view of liquidity across products',
              solutions: [
                {
                  id: 'liquidity-dashboard',
                  title: 'Unified liquidity dashboard across banking and brokerage',
                  assumptions: [
                    {
                      id: 'data-freshness',
                      text: 'We assume cross-system data refresh can meet user expectations.',
                    },
                  ],
                },
                {
                  id: 'rebalance-alerts',
                  title: 'Automated rebalance and risk alerts',
                  assumptions: [
                    {
                      id: 'alert-fatigue',
                      text: 'We assume alert frequency can be tuned to avoid fatigue.',
                    },
                    {
                      id: 'advisor-ops',
                      text: 'We assume advisor operations can absorb follow-up demand spikes.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'tcli-tcgi',
          title: 'TCLI / TCGI',
          smallerOpportunities: [
            {
              id: 'insurance-bundling',
              quote:
                '“Insurance choices are hard; I only buy when forced by a life event.”',
              title: 'Insurance products lack proactive bundle positioning',
              solutions: [
                {
                  id: 'life-event-bundles',
                  title: 'Life-event bundles for home, travel, and health',
                  assumptions: [
                    {
                      id: 'event-detection',
                      text: 'We assume life events can be inferred responsibly from declared data.',
                    },
                  ],
                },
                {
                  id: 'embedded-protection',
                  title: 'Embedded protection options in major ecosystem flows',
                  assumptions: [
                    {
                      id: 'opt-in-rate',
                      text: 'We assume embedded choices increase insurance opt-in conversion.',
                    },
                  ],
                },
              ],
            },
            {
              id: 'claims-experience',
              quote:
                '“Claims take too long and status updates are not transparent.”',
              title: 'Low confidence in claims experience',
              solutions: [
                {
                  id: 'claims-tracker',
                  title: 'Real-time claims tracker with clear SLAs',
                  assumptions: [
                    {
                      id: 'status-accuracy',
                      text: 'We assume claims systems can publish accurate stage updates.',
                    },
                    {
                      id: 'sla-enforcement',
                      text: 'We assume SLA transparency reduces service complaints.',
                    },
                  ],
                },
                {
                  id: 'rapid-resolution',
                  title: 'Rapid-resolution lane for low-risk claims',
                  assumptions: [
                    {
                      id: 'risk-model',
                      text: 'We assume low-risk claims can be identified with acceptable false positives.',
                    },
                  ],
                },
                {
                  id: 'care-concierge',
                  title: 'Care concierge for high-value customers',
                  assumptions: [
                    {
                      id: 'premium-retention',
                      text: 'We assume concierge support increases retention in premium segments.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
