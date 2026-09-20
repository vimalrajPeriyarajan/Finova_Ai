export type ResourceCategory =
  | 'Banks'
  | 'Investment Advisers'
  | 'Registered Valuers'
  | 'Jewellers'
  | 'Insurance'
  | 'Land Registration Offices'
  | 'Property Services';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NEEDS_RECHECK';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  authority: string;
  registrationNumber?: string;
  address: string;
  phone?: string;
  email?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  distanceKm?: number;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
  sourceNotice: string;
  isArchived: boolean;
  createdAt: string;
}

export type ReportIssueType =
  | 'WRONG_ADDRESS'
  | 'NOT_REGISTERED'
  | 'PHONE_DISCONNECTED'
  | 'FRAUDULENT'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ResourceReport {
  id: string;
  resourceId: string;
  resourceName?: string;
  reportedBy: string;
  reporterName?: string;
  issueType: ReportIssueType;
  notes: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}
