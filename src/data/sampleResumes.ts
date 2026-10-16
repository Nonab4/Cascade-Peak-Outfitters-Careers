export interface SampleResume {
  id: string;
  applicantName: string;
  targetRolePreview: string;
  tagline: string;
  hasMissingInfo: boolean;
  missingNote?: string;
  rawText: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'sample-jordan',
    applicantName: 'Jordan Vance',
    targetRolePreview: 'Marketing Coordinator / Sales',
    tagline: 'Complete Profile · 4 yrs Outdoor Lifestyle Experience',
    hasMissingInfo: false,
    rawText: `JORDAN VANCE
Email: jordan.vance.outdoors@gmail.com
Phone: (206) 555-0184
Location: Seattle, WA

PROFESSIONAL SUMMARY
Creative marketing coordinator and outdoor enthusiast with 4 years of experience coordinating experiential brand campaigns, athlete partnerships, and customer retail engagement in the Pacific Northwest apparel sector.

WORK EXPERIENCE

Field Marketing Coordinator | Rainier Ridge Outfitters
Seattle, WA | Sep 2022 - Present
- Coordinated 18 regional community trail clinics and outdoor gear demo events across Washington and Oregon, driving 35% growth in local loyalty signups.
- Managed editorial content calendar and drafted 45+ product spotlight newsletters with an average open rate of 34%.
- Partnered with 12 regional backcountry guide ambassadors for product field-testing and authentic social storytelling.

Assistant Retail Outfitter & Sales Lead | Alpine Timber Goods
Bellevue, WA | Jun 2020 - Aug 2022
- Provided technical consultative boot-fitting, technical shell layering, and pack fit adjustments for outdoor adventurers.
- Consistently exceeded monthly sales targets by 15-20% and trained 6 incoming sales associates on POS and merchandise display.
- Assisted store manager with weekly cycle counting, receiving dock shipments, and inventory replenishment.

EDUCATION
University of Washington, Seattle, WA
Bachelor of Arts in Communications & Environmental Studies
Graduated: 2020
Activities: UW Mountaineers Club Executive Member, Trail Crew Volunteer

SKILLS & CERTIFICATIONS
Content Marketing, Copywriting, Social Media, Email Campaigns (Klaviyo), Customer Service, Retail Sales, POS Systems, Event Coordination, Wilderness First Aid (WFA)`,
  },
  {
    id: 'sample-taylor-missing-info',
    applicantName: 'Taylor Chen',
    targetRolePreview: 'Management Trainee / Operations',
    tagline: 'Missing Phone & Graduation Year · Tests Missing Data Detection',
    hasMissingInfo: true,
    missingNote: 'Intentionally lacks Phone Number and Education Year to test AI extraction & missing data flagging',
    rawText: `TAYLOR CHEN
Email: t.chen.northwest@outlook.com
Location: Portland, OR
[Note: Candidate did not include phone number]

SUMMARY
Results-oriented team lead with 3+ years experience supervising fast-paced retail floor operations, scheduling staff, and coordinating community outdoor equipment workshops.

EXPERIENCE

Shift Supervisor & Customer Lead | Columbia Gorge Basecamp
Portland, OR | Feb 2023 - Present
- Supervise a team of 14 front-line retail associates during peak weekend shifts, overseeing cash handling, gear rentals, and customer conflict resolution.
- Streamlined stockroom staging procedures, reducing morning restocking cycle times from 45 minutes to 22 minutes.
- Received 2024 Northwest Employee of the Year for outstanding customer satisfaction ratings.

Operations Assistant | High Desert Equipment Co.
Bend, OR | Aug 2021 - Jan 2023
- Processed vendor purchase orders, audited packing slips, and maintained equipment rental service logs.
- Coordinated safety compliance inspections and scheduled preventive maintenance on demonstration rental fleets.

EDUCATION
Oregon State University, Corvallis, OR
Bachelor of Science in Business Administration & Leadership
[Year not specified on resume]
Focus: Organizational Behavior and Operations

SKILLS
Team Leadership, Customer Experience, Operations, Retail Management, Inventory Control, Problem Solving, POS Systems`,
  },
  {
    id: 'sample-morgan',
    applicantName: 'Morgan Diaz',
    targetRolePreview: 'Business Analyst / Supply Chain',
    tagline: 'Complete Profile · 5 yrs Analytical & Logistics Experience',
    hasMissingInfo: false,
    rawText: `MORGAN DIAZ
Email: morgan.diaz.analytics@proton.me
Phone: (503) 555-8392
Location: Portland, OR

EXECUTIVE SUMMARY
Analytical problem-solver with 5 years experience leveraging SQL, Tableau, and enterprise supply chain systems to optimize omni-channel inventory flow, reduce logistics bottlenecks, and improve retail forecasting precision.

WORK EXPERIENCE

Senior Logistics & Inventory Analyst | Pacific Rim Sports Distribution
Portland, OR | Jan 2022 - Present
- Engineered predictive inventory reordering models in SQL and Excel that decreased seasonal stockouts across 28 distribution points by 24%.
- Built automated Tableau dashboards tracking weekly freight container transit times, ocean carrier demurrage fees, and port dwell metrics.
- Collaborated with merchandise buyers to forecast seasonal demand peaks for winter thermal garments and alpine equipment.

Business Operations Analyst | Northwest Trailcraft Co.
Vancouver, WA | Jul 2019 - Dec 2021
- Conducted variance analysis on freight costs, saving $140K annually through consolidated pallet LTL carrier renegotiations.
- Supported ERP transition to NetSuite, authoring standard operating workflows and training 25 warehouse associates.

EDUCATION
Portland State University, Portland, OR
Bachelor of Science in Supply Chain Management & Data Analytics
Graduated: 2019
Honors: Cum Laude, Dean's List

CORE COMPETENCIES & TECHNICAL SKILLS
SQL, Tableau, Power BI, Supply Chain, Logistics, Inventory Optimization, NetSuite, ERP, Financial Modeling, Data Analysis, Vendor Management, Advanced Excel`,
  },
];
