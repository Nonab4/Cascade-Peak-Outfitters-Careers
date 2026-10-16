export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationYear?: string;
  details?: string;
  isExtracted?: boolean;
}

export interface WorkExperienceItem {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
  isExtracted?: boolean;
}

export interface ApplicantData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: EducationItem[];
  workExperience: WorkExperienceItem[];
  skills: string[];
  missingFields: string[];
  rawText?: string;
  fileName?: string;
  fileSize?: number;
  extractedAt?: string;
  extractionConfidenceNotes?: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  workType: 'Full-Time' | 'Part-Time' | 'Trainee' | 'Contract';
  salaryRange: string;
  description: string;
  keyResponsibilities: string[];
  requirements: string[];
  relevantSkills: string[];
}

export type ApplicationStep = 1 | 2 | 3 | 4 | 5;

export interface ApplicationSubmission {
  referenceId: string;
  submittedAt: string;
  applicant: ApplicantData;
  selectedPositions: JobPosition[];
  accuracyCertified: boolean;
  notes?: string;
}
