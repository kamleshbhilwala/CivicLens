
export enum ComplaintType {
  ROAD = 'Road Issue / Potholes',
  DRAINAGE = 'Drainage Problem',
  STREET_LIGHT = 'Street Light Not Working',
  WATER = 'Water Supply Issue',
  GARBAGE = 'Garbage / Sanitation',
  OTHER = 'Other'
}

export enum ComplaintLanguage {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  GUJARATI = 'Gujarati',
  MARATHI = 'Marathi',
  PUNJABI = 'Punjabi',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  KANNADA = 'Kannada',
  MALAYALAM = 'Malayalam',
  BENGALI = 'Bengali'
}

export enum ComplaintTemplate {
  NORMAL = 'Normal Complaint',
  URGENT = 'Urgent - Immediate Action',
  REMINDER = 'Reminder / Follow-up'
}

export enum ComplaintStatus {
  DRAFT = 'Draft',
  DOWNLOADED = 'Downloaded',
  SUBMITTED = 'Submitted',
  RESOLVED = 'Resolved'
}

export interface LocationDetails {
  area: string;
  city: string;
  state: string;
  ward?: string;
}

export interface ComplaintData {
  id: string;
  type: ComplaintType;
  dateCreated: string;
  description: string;
  image: string | null; // base64
  generatedLetter: string;
  
  // New Fields
  locationDetails: LocationDetails;
  language: ComplaintLanguage;
  template: ComplaintTemplate;
  authority: string;
  status: ComplaintStatus;
}

export interface StepProps {
  data: Partial<ComplaintData>;
  updateData: (updates: Partial<ComplaintData>) => void;
  onNext: () => void;
  onBack: () => void;
}
