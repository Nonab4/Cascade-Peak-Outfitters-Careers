import { ApplicantData } from '../types/application';

export interface SampleResume {
  id: string;
  applicantName: string;
  targetRolePreview: string;
  tagline: string;
  hasMissingInfo: boolean;
  missingNote?: string;
  rawText: string;
  structuredData: ApplicantData;
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
    structuredData: {
      fullName: 'Jordan Vance',
      email: 'jordan.vance.outdoors@gmail.com',
      phone: '(206) 555-0184',
      location: 'Seattle, WA',
      summary:
        'Creative marketing coordinator and outdoor enthusiast with 4 years of experience coordinating experiential brand campaigns, athlete partnerships, and customer retail engagement in the Pacific Northwest apparel sector.',
      education: [
        {
          id: 'sample-jordan-edu-1',
          institution: 'University of Washington',
          degree: 'Bachelor of Arts in Communications & Environmental Studies',
          fieldOfStudy: 'Communications & Environmental Studies',
          graduationYear: '2020',
          details: 'Seattle, WA · Activities: UW Mountaineers Club Executive Member, Trail Crew Volunteer',
          isExtracted: true,
        },
      ],
      workExperience: [
        {
          id: 'sample-jordan-work-1',
          company: 'Rainier Ridge Outfitters',
          title: 'Field Marketing Coordinator',
          startDate: 'Sep 2022',
          endDate: 'Present',
          current: true,
          description:
            'Coordinated 18 regional community trail clinics and outdoor gear demo events across Washington and Oregon, driving 35% growth in local loyalty signups. Managed editorial content calendar and drafted 45+ product spotlight newsletters with an average open rate of 34%. Partnered with 12 regional backcountry guide ambassadors for product field-testing and authentic social storytelling.',
          isExtracted: true,
        },
        {
          id: 'sample-jordan-work-2',
          company: 'Alpine Timber Goods',
          title: 'Assistant Retail Outfitter & Sales Lead',
          startDate: 'Jun 2020',
          endDate: 'Aug 2022',
          current: false,
          description:
            'Provided technical consultative boot-fitting, technical shell layering, and pack fit adjustments for outdoor adventurers. Consistently exceeded monthly sales targets by 15-20% and trained 6 incoming sales associates on POS and merchandise display. Assisted store manager with weekly cycle counting, receiving dock shipments, and inventory replenishment.',
          isExtracted: true,
        },
      ],
      skills: [
        'Content Marketing',
        'Copywriting',
        'Social Media',
        'Email Campaigns (Klaviyo)',
        'Customer Service',
        'Retail Sales',
        'POS Systems',
        'Event Coordination',
        'Wilderness First Aid (WFA)',
      ],
      missingFields: [],
      fileName: 'jordan_vance_cv.txt',
      fileSize: 1845,
      extractedAt: new Date().toISOString(),
      extractionConfidenceNotes: 'High confidence. All required fields detected from sample profile.',
    },
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
    structuredData: {
      fullName: 'Taylor Chen',
      email: 't.chen.northwest@outlook.com',
      phone: '',
      location: 'Portland, OR',
      summary:
        'Results-oriented team lead with 3+ years experience supervising fast-paced retail floor operations, scheduling staff, and coordinating community outdoor equipment workshops.',
      education: [
        {
          id: 'sample-taylor-edu-1',
          institution: 'Oregon State University',
          degree: 'Bachelor of Science in Business Administration & Leadership',
          fieldOfStudy: 'Business Administration & Leadership',
          graduationYear: '',
          details: 'Corvallis, OR · Focus: Organizational Behavior and Operations',
          isExtracted: true,
        },
      ],
      workExperience: [
        {
          id: 'sample-taylor-work-1',
          company: 'Columbia Gorge Basecamp',
          title: 'Shift Supervisor & Customer Lead',
          startDate: 'Feb 2023',
          endDate: 'Present',
          current: true,
          description:
            'Supervise a team of 14 front-line retail associates during peak weekend shifts, overseeing cash handling, gear rentals, and customer conflict resolution. Streamlined stockroom staging procedures, reducing morning restocking cycle times from 45 minutes to 22 minutes. Received 2024 Northwest Employee of the Year for outstanding customer satisfaction ratings.',
          isExtracted: true,
        },
        {
          id: 'sample-taylor-work-2',
          company: 'High Desert Equipment Co.',
          title: 'Operations Assistant',
          startDate: 'Aug 2021',
          endDate: 'Jan 2023',
          current: false,
          description:
            'Processed vendor purchase orders, audited packing slips, and maintained equipment rental service logs. Coordinated safety compliance inspections and scheduled preventive maintenance on demonstration rental fleets.',
          isExtracted: true,
        },
      ],
      skills: [
        'Team Leadership',
        'Customer Experience',
        'Operations',
        'Retail Management',
        'Inventory Control',
        'Problem Solving',
        'POS Systems',
      ],
      missingFields: ['phone', 'education[0].graduationYear'],
      fileName: 'taylor_chen_cv.txt',
      fileSize: 1620,
      extractedAt: new Date().toISOString(),
      extractionConfidenceNotes:
        'Test profile with missing fields: Phone Number not provided; Graduation Year not specified.',
    },
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
    structuredData: {
      fullName: 'Morgan Diaz',
      email: 'morgan.diaz.analytics@proton.me',
      phone: '(503) 555-8392',
      location: 'Portland, OR',
      summary:
        'Analytical problem-solver with 5 years experience leveraging SQL, Tableau, and enterprise supply chain systems to optimize omni-channel inventory flow, reduce logistics bottlenecks, and improve retail forecasting precision.',
      education: [
        {
          id: 'sample-morgan-edu-1',
          institution: 'Portland State University',
          degree: 'Bachelor of Science in Supply Chain Management & Data Analytics',
          fieldOfStudy: 'Supply Chain Management & Data Analytics',
          graduationYear: '2019',
          details: "Portland, OR · Honors: Cum Laude, Dean's List",
          isExtracted: true,
        },
      ],
      workExperience: [
        {
          id: 'sample-morgan-work-1',
          company: 'Pacific Rim Sports Distribution',
          title: 'Senior Logistics & Inventory Analyst',
          startDate: 'Jan 2022',
          endDate: 'Present',
          current: true,
          description:
            'Engineered predictive inventory reordering models in SQL and Excel that decreased seasonal stockouts across 28 distribution points by 24%. Built automated Tableau dashboards tracking weekly freight container transit times, ocean carrier demurrage fees, and port dwell metrics. Collaborated with merchandise buyers to forecast seasonal demand peaks for winter thermal garments and alpine equipment.',
          isExtracted: true,
        },
        {
          id: 'sample-morgan-work-2',
          company: 'Northwest Trailcraft Co.',
          title: 'Business Operations Analyst',
          startDate: 'Jul 2019',
          endDate: 'Dec 2021',
          current: false,
          description:
            'Conducted variance analysis on freight costs, saving $140K annually through consolidated pallet LTL carrier renegotiations. Supported ERP transition to NetSuite, authoring standard operating workflows and training 25 warehouse associates.',
          isExtracted: true,
        },
      ],
      skills: [
        'SQL',
        'Tableau',
        'Power BI',
        'Supply Chain',
        'Logistics',
        'Inventory Optimization',
        'NetSuite',
        'ERP',
        'Financial Modeling',
        'Data Analysis',
        'Vendor Management',
        'Advanced Excel',
      ],
      missingFields: [],
      fileName: 'morgan_diaz_cv.txt',
      fileSize: 1980,
      extractedAt: new Date().toISOString(),
      extractionConfidenceNotes: 'High confidence. All required fields detected from sample profile.',
    },
  },
];

