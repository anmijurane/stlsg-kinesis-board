export interface ClubOption {
  id: string;
  name: string;
  city: string;
}

export interface MetricDistribution {
  label: string;
  count: number;
  percentage?: number;
}

export interface GlobalMetrics {
  totalSessions: number;
  totalPageViews: number;
  totalEvents: number;
  totalFeedback: number;
  positiveFeedbackRatio: number;
  routines: MetricDistribution[];
  routineLevels: MetricDistribution[];
  topClubs: (MetricDistribution & { id: string; city: string })[];
  eventsDistribution: MetricDistribution[];
  osDistribution: MetricDistribution[];
  feedbackDistribution: {
    emoji: "happy" | "neutral" | "sad" | "null" | string;
    count: number;
    percentage: number;
  }[];
}

export interface SessionFilterOptions {
  clubId?: string;
  routine?: string;
  hasDemographicForm?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface SessionSummary {
  id: number;
  sessionRef: string;
  clubId: string | null;
  clubName: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  hasDemographicForm: boolean;
  hasFeedback: boolean;
  pageViewsCount: number;
  eventsCount: number;
}

export interface SessionsPaginatedResult {
  sessions: SessionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DemographicFormData {
  id: number;
  gender: string;
  ageRange: string;
  membership: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

export interface EventRecord {
  id: number;
  pageViewId: number | null;
  type: string;
  exerciseId: string | null;
  exerciseName: string | null;
  routine: string | null;
  levelId: number | null;
  dayRoutine: number | null;
  createdAt: string;
}

export interface PageViewWithEvents {
  id: number;
  pagePath: string;
  queryString: string | null;
  routine: string | null;
  levelId: number | null;
  levelLabel: string | null;
  visitedAt: string;
  events: EventRecord[];
}

export interface FeedbackItem {
  id: number;
  emoji: string;
  exerciseId: string | null;
  exerciseName: string | null;
  comment: string | null;
  createdAt: string;
}

export interface SessionDetail {
  session: SessionSummary;
  demographicForm: DemographicFormData | null;
  pageViews: PageViewWithEvents[];
  unattachedEvents: EventRecord[];
  feedbacks: FeedbackItem[];
}
