import { ApplicantData, JobPosition } from '../types/application';

export interface PositionRecommendation {
  positionId: string;
  matchedTerms: string[];
  explanation: string;
}

/**
 * Broad transferable skills that can support a recommendation, but CANNOT
 * by themselves trigger one without strong role-specific evidence.
 */
const GENERIC_SUPPORTING_SKILLS = new Set([
  'communication',
  'verbal communication',
  'written communication',
  'teamwork',
  'problem solving',
  'customer service',
  'management',
  'leadership',
  'cross functional communication',
  'cross-functional communication',
  'active listening',
  'interpersonal skills',
  'time management',
  'organization',
  'adaptability',
  'attention to detail',
]);

/**
 * Role-specific definitions defining:
 * - strongKeywords: high-signal technical terms, responsibilities, methods, tools
 * - relevantFieldsOfStudy: majors/degrees directly aligned with the discipline
 * - relevantJobTitles: past job titles indicating direct professional experience in the function
 */
interface RoleCriteria {
  strongKeywords: { term: string; label: string; patterns: RegExp[] }[];
  relevantFieldsOfStudy: RegExp[];
  relevantJobTitles: RegExp[];
}

const ROLE_CRITERIA_MAP: Record<string, RoleCriteria> = {
  'business-analyst': {
    strongKeywords: [
      { term: 'sql', label: 'SQL', patterns: [/\bsql\b/i] },
      { term: 'excel', label: 'Excel', patterns: [/\b(excel|spreadsheets?|spreadsheet modeling)\b/i] },
      { term: 'power bi', label: 'Power BI', patterns: [/\bpower\s*bi\b/i] },
      { term: 'tableau', label: 'Tableau', patterns: [/\btableau\b/i] },
      { term: 'data analysis', label: 'data analysis', patterns: [/\b(data analy[si]s|data analytics|analyzing data|quantitative analysis|business analytics)\b/i] },
      { term: 'reporting', label: 'reporting', patterns: [/\b(reports?|reporting|weekly reporting|reporting tools?)\b/i] },
      { term: 'dashboards', label: 'dashboards', patterns: [/\bdashboards?\b/i] },
      { term: 'business analytics', label: 'business analytics', patterns: [/\bbusiness analytics\b/i] },
      { term: 'financial modeling', label: 'financial modeling', patterns: [/\bfinancial model(ing)?\b/i] },
      { term: 'variance analysis', label: 'variance analysis', patterns: [/\bvariance analysis\b/i] },
      { term: 'data visualization', label: 'data visualization', patterns: [/\bdata visualiz(ation|ing)\b/i] },
      { term: 'process optimization', label: 'process optimization', patterns: [/\b(process optimization|workflow optimization)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(business analytics|data analytics|analytics|information systems|statistics|data science|economics)\b/i,
    ],
    relevantJobTitles: [
      /\b(business analyst|data analyst|analytics|reporting analyst|bi analyst)\b/i,
    ],
  },

  'management-trainee': {
    strongKeywords: [
      { term: 'employee training', label: 'employee training', patterns: [/\b(train(ed|ing)?\s+(staff|employees|associates|team)|staff training|onboarding)\b/i] },
      { term: 'leadership', label: 'leadership', patterns: [/\b(leadership|lead\s+associate|team lead|shift lead)\b/i] },
      { term: 'supervision', label: 'supervision', patterns: [/\b(supervis(ed|ing|ion)|shift supervisor|floor supervision)\b/i] },
      { term: 'team coordination', label: 'team coordination', patterns: [/\b(team coordination|coordinat(ed|ing)\s+(staff|teams?)|scheduling staff)\b/i] },
      { term: 'retail operations', label: 'retail operations', patterns: [/\b(retail operations|store operations|floor operations)\b/i] },
      { term: 'operational responsibility', label: 'operational leadership', patterns: [/\b(opening( and| &)? closing|store management|operational responsibility|shift management)\b/i] },
      { term: 'conflict resolution', label: 'customer conflict resolution', patterns: [/\b(conflict resolution|customer escalation)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(business administration|management|organizational leadership|retail management)\b/i,
    ],
    relevantJobTitles: [
      /\b(supervisor|team lead|shift lead|assistant manager|manager|trainee|coordinator)\b/i,
    ],
  },

  'sales-associate': {
    strongKeywords: [
      { term: 'retail sales', label: 'retail sales', patterns: [/\b(retail sales|sales targets?|store sales|selling)\b/i] },
      { term: 'pos systems', label: 'POS systems', patterns: [/\b(pos|point[\s-]of[\s-]sale|cash handling|cashier|registers?)\b/i] },
      { term: 'merchandising', label: 'merchandising', patterns: [/\b(merchandis(ing|e)|product displays?|restock(ing)?|floor displays?)\b/i] },
      { term: 'product assistance', label: 'product assistance', patterns: [/\b(consultative|product inquiries|equipment fit|boot-fitting|gear demo)\b/i] },
      { term: 'returns', label: 'returns and exchanges', patterns: [/\b(returns|exchanges|customer returns)\b/i] },
      { term: 'customer service', label: 'direct customer service', patterns: [/\b(front-line|customer inquiries|customer consultations?|customer-facing)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(retail|hospitality|sales)\b/i,
    ],
    relevantJobTitles: [
      /\b(sales associate|retail associate|sales representative|cashier|outfitter|customer service associate)\b/i,
    ],
  },

  'marketing-coordinator': {
    strongKeywords: [
      { term: 'marketing campaigns', label: 'marketing campaigns', patterns: [/\b(marketing campaigns?|seasonal campaigns?|brand campaigns?|ad campaigns?)\b/i] },
      { term: 'social media', label: 'social media', patterns: [/\b(social media|social storytelling|instagram|content calendar)\b/i] },
      { term: 'content creation', label: 'content creation', patterns: [/\b(content creation|content marketing|digital content)\b/i] },
      { term: 'copywriting', label: 'copywriting', patterns: [/\b(copywriting|creative writing|drafting newsletters?)\b/i] },
      { term: 'promotions', label: 'promotions', patterns: [/\b(promotions?|promotional schedules?|promotional events?)\b/i] },
      { term: 'event coordination', label: 'event coordination', patterns: [/\b(event coordination|planning events|field marketing|clinics|sponsorships)\b/i] },
      { term: 'email campaigns', label: 'email campaigns', patterns: [/\b(email campaigns?|klaviyo|mailchimp|newsletters?)\b/i] },
      { term: 'brand communications', label: 'brand communications', patterns: [/\b(brand communications?|brand voice|brand storytelling|public relations)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(marketing|communications?|public relations|advertising|journalism)\b/i,
    ],
    relevantJobTitles: [
      /\b(marketing coordinator|marketing assistant|marketing specialist|social media coordinator|content creator|copywriter)\b/i,
    ],
  },

  'supply-chain-analyst': {
    strongKeywords: [
      { term: 'inventory management', label: 'inventory management', patterns: [/\b(inventory( optimization| analysis| management| safety stock| turnover| flow)?|stockouts?)\b/i] },
      { term: 'logistics', label: 'logistics', patterns: [/\b(logistics|freight|shipping|carriers?|fulfillment|transit times?)\b/i] },
      { term: 'supply chain', label: 'supply chain', patterns: [/\b(supply chain|supplier delivery|replenishment)\b/i] },
      { term: 'erp systems', label: 'ERP systems', patterns: [/\b(erp|netsuite|sap|oracle erp|retail erp)\b/i] },
      { term: 'purchasing', label: 'purchasing', patterns: [/\b(purchasing|purchase orders?|procurement)\b/i] },
      { term: 'receiving', label: 'receiving', patterns: [/\b(receiving dock|packing slips?|receiving shipments?)\b/i] },
      { term: 'vendor management', label: 'vendor coordination', patterns: [/\b(vendor management|vendors?|supplier collaborations?)\b/i] },
      { term: 'warehousing', label: 'warehousing', patterns: [/\b(warehous(e|ing)|distribution center|distribution points?|pallet)\b/i] },
      { term: 'forecasting', label: 'supply forecasting', patterns: [/\b(supply forecasting|demand forecasting|predictive reordering)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(supply chain|logistics|industrial engineering|operations management|procurement)\b/i,
    ],
    relevantJobTitles: [
      /\b(supply chain|logistics analyst|inventory analyst|distribution analyst|procurement specialist)\b/i,
    ],
  },

  'operations-coordinator': {
    strongKeywords: [
      { term: 'operations', label: 'operations coordination', patterns: [/\b(business operations|operational workflows?|operations management|operations assistant)\b/i] },
      { term: 'process improvement', label: 'process improvement', patterns: [/\b(process improvement|standard operating procedures?|sops?|workflow analysis|streamlined)\b/i] },
      { term: 'workflow analysis', label: 'workflow coordination', patterns: [/\b(workflow analysis|operational documentation|action items?)\b/i] },
      { term: 'administration', label: 'administrative coordination', patterns: [/\b(administrative( coordination| workflows?| support)?|office management)\b/i] },
      { term: 'vendor coordination', label: 'vendor coordination', patterns: [/\b(vendor service orders?|vendor coordination|vendor relations?)\b/i] },
      { term: 'facilities', label: 'facilities support', patterns: [/\b(facilities( maintenance)?|supply ordering|equipment upkeep|service logs?)\b/i] },
      { term: 'operational support', label: 'operational support', patterns: [/\b(scheduling|meeting coordination|compliance inspections?|preventive maintenance)\b/i] },
    ],
    relevantFieldsOfStudy: [
      /\b(business administration|operations management|management|public administration)\b/i,
    ],
    relevantJobTitles: [
      /\b(operations coordinator|operations assistant|operations analyst|administrative coordinator|office manager|project coordinator)\b/i,
    ],
  },
};

/**
 * Normalizes a phrase or term into a clean alphanumeric lowercase string.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Evaluates whether a role should be recommended based on meaningful role-specific evidence:
 * - At least two strong role-specific matches, OR
 * - One strong role-specific match plus clearly relevant work experience, education, or project background.
 *
 * Generic skills (communication, teamwork, etc.) alone will NOT trigger a recommendation.
 */
export function getPositionRecommendations(
  applicant: ApplicantData | null | undefined,
  positions: JobPosition[]
): Map<string, PositionRecommendation> {
  const recommendations = new Map<string, PositionRecommendation>();

  if (!applicant) {
    return recommendations;
  }

  // Check if we have sufficient applicant information to make meaningful recommendations.
  const hasSkills = Boolean(applicant.skills && applicant.skills.length > 0);
  const hasEdu = Boolean(applicant.education && applicant.education.some(e => e.institution || e.fieldOfStudy || e.degree));
  const hasWork = Boolean(applicant.workExperience && applicant.workExperience.some(w => w.title || w.description));
  const hasSummary = Boolean(applicant.summary && applicant.summary.trim().length > 20);

  if (!hasSkills && !hasEdu && !hasWork && !hasSummary) {
    return recommendations;
  }

  // Pre-collect applicant raw texts and skill lists
  const applicantSkills = (applicant.skills || []).map(s => s.trim()).filter(Boolean);
  const workList = applicant.workExperience || [];
  const eduList = applicant.education || [];
  const summaryText = applicant.summary || '';

  // Combine full text for secondary pattern verification
  const fullText = [
    summaryText,
    ...applicantSkills,
    ...eduList.map(e => `${e.degree || ''} ${e.fieldOfStudy || ''} ${e.institution || ''} ${e.details || ''}`),
    ...workList.map(w => `${w.title || ''} ${w.company || ''} ${w.description || ''}`),
  ].join(' ');

  for (const position of positions) {
    const criteria = ROLE_CRITERIA_MAP[position.id];
    if (!criteria) continue;

    // Detect strong keyword matches
    const matchedEvidenceMap = new Map<string, string>(); // key: term, value: clean display label

    // 1. Check applicant skills for strong matches
    applicantSkills.forEach(skill => {
      const normSkill = skill.toLowerCase();
      // Ignore if purely generic skill
      if (GENERIC_SUPPORTING_SKILLS.has(normSkill)) return;

      criteria.strongKeywords.forEach(kw => {
        if (kw.patterns.some(p => p.test(skill))) {
          matchedEvidenceMap.set(kw.term, skill); // use applicant's actual skill wording when possible
        }
      });
    });

    // 2. Check work experience descriptions & responsibilities for strong keyword patterns
    workList.forEach(work => {
      const textToSearch = `${work.title || ''} ${work.description || ''}`;
      criteria.strongKeywords.forEach(kw => {
        if (!matchedEvidenceMap.has(kw.term)) {
          if (kw.patterns.some(p => p.test(textToSearch))) {
            matchedEvidenceMap.set(kw.term, kw.label);
          }
        }
      });
    });

    // 3. Check summary for strong keyword patterns
    if (summaryText) {
      criteria.strongKeywords.forEach(kw => {
        if (!matchedEvidenceMap.has(kw.term)) {
          if (kw.patterns.some(p => p.test(summaryText))) {
            matchedEvidenceMap.set(kw.term, kw.label);
          }
        }
      });
    }

    const strongMatchesCount = matchedEvidenceMap.size;

    // Check relevant education background
    let hasRelevantEducation = false;
    let relevantEducationLabel = '';
    eduList.forEach(edu => {
      const field = `${edu.fieldOfStudy || ''} ${edu.degree || ''}`;
      if (criteria.relevantFieldsOfStudy.some(p => p.test(field))) {
        hasRelevantEducation = true;
        if (!relevantEducationLabel) {
          relevantEducationLabel = edu.fieldOfStudy ? `${edu.fieldOfStudy} education` : 'relevant education';
        }
      }
    });

    // Check relevant past job title experience
    let hasRelevantJobTitle = false;
    let relevantTitleLabel = '';
    workList.forEach(work => {
      const title = work.title || '';
      if (criteria.relevantJobTitles.some(p => p.test(title))) {
        hasRelevantJobTitle = true;
        if (!relevantTitleLabel) {
          relevantTitleLabel = `${title} experience`;
        }
      }
    });

    const hasStrongBackground = hasRelevantEducation || hasRelevantJobTitle;

    // Decision rule:
    // Recommend when:
    // - at least two strong role-specific matches, OR
    // - one strong role-specific match plus clearly relevant work experience or education
    const meetsCriteria =
      strongMatchesCount >= 2 ||
      (strongMatchesCount >= 1 && hasStrongBackground);

    if (meetsCriteria) {
      // Pick the strongest 2-4 pieces of evidence actually found in applicant's record
      const evidenceList: string[] = [];

      // Add actual matched terms
      Array.from(matchedEvidenceMap.values()).forEach(item => {
        if (evidenceList.length < 4 && !evidenceList.includes(item)) {
          evidenceList.push(item);
        }
      });

      // If we have relevant education and room, include it
      if (hasRelevantEducation && evidenceList.length < 4 && relevantEducationLabel) {
        if (!evidenceList.some(e => e.toLowerCase().includes('education'))) {
          evidenceList.push(relevantEducationLabel);
        }
      }

      // Format clean explanation sentence
      let explanation = '';
      if (evidenceList.length === 1) {
        explanation = `Your ${evidenceList[0]} experience aligns with this role.`;
      } else if (evidenceList.length === 2) {
        explanation = `Your ${evidenceList[0]} and ${evidenceList[1]} experience aligns with this role.`;
      } else if (evidenceList.length === 3) {
        explanation = `Your ${evidenceList[0]}, ${evidenceList[1]}, and ${evidenceList[2]} experience aligns with this role.`;
      } else {
        const last = evidenceList[evidenceList.length - 1];
        const initial = evidenceList.slice(0, -1).join(', ');
        explanation = `Your ${initial}, and ${last} experience aligns with this role.`;
      }

      recommendations.set(position.id, {
        positionId: position.id,
        matchedTerms: evidenceList,
        explanation,
      });
    }
  }

  return recommendations;
}
