// Core project models
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  defaultProvider?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  // Computed
  searchCount?: number;
  pinnedCount?: number;
  teamSize?: number;
}

export interface SavedSearch {
  id: number;
  projectId: number;
  queryString: string;
  parsedQuery?: Record<string, unknown>;
  providers: string[];
  filters: Record<string, unknown>;
  resultCount: number;
  earliestFilingYear?: number;
  latestFilingYear?: number;
  runAt: string;
  createdAt: string;
  notes?: string;
  // Computed for UI
  cachedStats?: {
    topAssignees: Array<{ name: string; count: number }>;
    filingTrend: Array<{ year: number; count: number }>;
    technologyDistribution: Array<{ class: string; count: number }>;
  };
}

export type PatentReviewStatus =
  | 'TO_REVIEW'
  | 'RELEVANT'
  | 'KEY_PRIOR_ART'
  | 'EXCLUDED';

export interface PatentReference {
  id: number;
  projectId: number;
  patentId: string;
  patentData: {
    patentNumber?: string;
    title: string;
    assignee: string;
    abstract: string;
    filingDate: string;
    grantDate: string;
    inventors: string[];
    provider: string;
    url?: string;
    familyId?: string;
    isFamilyRepresentative?: boolean;
  };
  pinnedAt: string;
  status: PatentReviewStatus;
  statusReason?: string;
  notes?: string;
  collectionIds?: number[];
}

export interface Collection {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface CollectionItem {
  id: number;
  collectionId: number;
  patentReferenceId: number;
}

export interface Comment {
  id: number;
  authorId: number;
  projectId: number;
  resourceType: string; // 'project', 'search', 'patent'
  resourceId?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentCommentId?: number;
  author?: User;
  replies?: Comment[];
}

export interface ProjectShare {
  id: number;
  projectId: number;
  userId?: number;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  shareToken?: string;
  shareTokenExpiresAt?: string;
  grantedAt: string;
  user?: User;
}

export interface ActivityLogEntry {
  id: number;
  projectId: number;
  actorId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: User;
}

export interface SearchComparisonResponse {
  searches: Array<{
    id: number;
    queryString: string;
    resultCount: number;
    earliestFilingYear?: number;
    latestFilingYear?: number;
  }>;
  mergedTimeline: Array<{
    year: number;
    [key: string]: number | string;
  }>;
  assigneeComparison: Array<{
    assigneeName: string;
    [key: string]: number | string;
  }>;
  overlap: {
    sharedAssignees: string[];
    sharedCpcClasses: string[];
    estimatedOverlapPercentage: number;
  };
  statistics: {
    [searchId: string]: {
      avgFilingYear: number;
      medianFilingYear: number;
    };
  };
}
