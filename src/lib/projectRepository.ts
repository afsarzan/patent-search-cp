import { Patent, PatentProvider } from '@/lib/patentApi';
import {
  Comment,
  Collection,
  isPatentReviewStatus,
  PatentReviewStatus,
  PatentReference,
  Project,
  ProjectShare,
  SavedSearch,
  SearchComparisonResponse,
  User,
} from '@/types/projects';

interface ProjectStore {
  projects: Project[];
  searches: SavedSearch[];
  patents: PatentReference[];
  collections: Collection[];
  comments: Comment[];
  shares: ProjectShare[];
  users: User[];
  counters: {
    project: number;
    search: number;
    patent: number;
    collection: number;
    comment: number;
    share: number;
    user: number;
  };
}

interface CreateProjectInput {
  name: string;
  description?: string;
  defaultProvider?: string;
}

interface UpdateProjectInput {
  name: string;
  description?: string;
  defaultProvider?: string;
}

interface SaveSearchInput {
  queryString: string;
  parsedQuery?: Record<string, unknown>;
  providers: PatentProvider[];
  filters?: Record<string, unknown>;
  cachedResults: Patent[];
  cachedStats?: {
    topAssignees?: Array<{ name: string; count: number }>;
    filingTrend?: Array<{ year: number; count: number }>;
    technologyDistribution?: Array<{ class: string; count: number }>;
    [key: string]: unknown;
  };
  notes?: string;
  watchFrequency?: 'NONE' | 'DAILY' | 'WEEKLY';
}

interface UpdateSavedSearchWatchFrequencyInput {
  watchFrequency: 'NONE' | 'DAILY' | 'WEEKLY';
}

interface AddCommentInput {
  resourceType?: string;
  resourceId?: number;
  content: string;
}

interface AddShareInput {
  userEmail: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

interface CreateCollectionInput {
  name: string;
  description?: string;
}

interface PinPatentInput {
  patent: Patent;
  notes?: string;
  collectionId?: number;
}

interface UpdatePatentReviewStatusInput {
  status: PatentReviewStatus;
  statusReason?: string;
}

interface BulkUpdatePatentReviewStatusInput {
  patentReferenceIds: number[];
  status: PatentReviewStatus;
  statusReason?: string;
}

const STORAGE_KEY = 'patent-explorer:project-store:v1';
const CURRENT_USER_ID = 1;

const nowIso = () => new Date().toISOString();

function createInitialState(): ProjectStore {
  const now = nowIso();
  return {
    projects: [],
    searches: [],
    patents: [],
    collections: [],
    comments: [],
    shares: [],
    users: [
      {
        id: CURRENT_USER_ID,
        email: 'owner@patentexplorer.local',
        name: 'Project Owner',
        createdAt: now,
      },
    ],
    counters: {
      project: 1,
      search: 1,
      patent: 1,
      collection: 1,
      comment: 1,
      share: 1,
      user: 2,
    },
  };
}

function cloneInitialState(): ProjectStore {
  return structuredClone(createInitialState());
}

function writeStore(store: ProjectStore) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function readStore(): ProjectStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = cloneInitialState();
    writeStore(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProjectStore>;
    return {
      ...cloneInitialState(),
      ...parsed,
      searches: (parsed.searches || []).map(hydrateSearch),
      patents: (parsed.patents || []).map(hydratePatentReference),
      projects: parsed.projects || [],
      collections: parsed.collections || [],
      comments: parsed.comments || [],
      shares: parsed.shares || [],
      users: parsed.users || cloneInitialState().users,
      counters: {
        ...cloneInitialState().counters,
        ...(parsed.counters || {}),
      },
    };
  } catch {
    const initial = cloneInitialState();
    writeStore(initial);
    return initial;
  }
}

function withStore<T>(updater: (store: ProjectStore) => T): T {
  const store = readStore();
  const result = updater(store);
  writeStore(store);
  return result;
}

function nextId(store: ProjectStore, counter: keyof ProjectStore['counters']) {
  const id = store.counters[counter];
  store.counters[counter] += 1;
  return id;
}

function getProjectOrThrow(store: ProjectStore, projectId: number) {
  const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
  if (!project) throw new Error('Project not found');
  return project;
}

function computeProjectStats(store: ProjectStore, project: Project): Project {
  const projectShares = store.shares.filter((share) => share.projectId === project.id);
  return {
    ...project,
    searchCount: store.searches.filter((search) => search.projectId === project.id).length,
    pinnedCount: store.patents.filter((patent) => patent.projectId === project.id).length,
    teamSize: Math.max(1, projectShares.length),
  };
}

function getOrCreateUserByEmail(store: ProjectStore, email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = store.users.find((user) => user.email.toLowerCase() === normalized);
  if (existing) return existing;

  const user: User = {
    id: nextId(store, 'user'),
    email: normalized,
    name: normalized.split('@')[0] || 'Teammate',
    createdAt: nowIso(),
  };
  store.users.push(user);
  return user;
}

function normalizeWatchFrequency(value: unknown): 'NONE' | 'DAILY' | 'WEEKLY' {
  return value === 'DAILY' || value === 'WEEKLY' ? value : 'NONE';
}

function hydrateSearch(search: SavedSearch): SavedSearch {
  return {
    ...search,
    watchFrequency: normalizeWatchFrequency(search.watchFrequency),
    alertRunCount: typeof search.alertRunCount === 'number' ? search.alertRunCount : 0,
    newSinceLastRun: typeof search.newSinceLastRun === 'number' ? search.newSinceLastRun : 0,
    lastAlertResultCount:
      typeof search.lastAlertResultCount === 'number' ? search.lastAlertResultCount : search.resultCount,
  };
}

function hydratePatentReference(patent: PatentReference): PatentReference {
  return {
    ...patent,
    status: isPatentReviewStatus(patent.status) ? patent.status : 'TO_REVIEW',
    statusReason:
      typeof patent.statusReason === 'string' && patent.statusReason.trim().length > 0
        ? patent.statusReason.trim()
        : undefined,
    collectionIds: patent.collectionIds || [],
  };
}

function projectDetailPayload(store: ProjectStore, projectId: number) {
  const project = getProjectOrThrow(store, projectId);
  const usersById = new Map(store.users.map((user) => [user.id, user]));

  const searches = store.searches
    .filter((search) => search.projectId === projectId)
    .map(hydrateSearch)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const pinnedPatents = store.patents
    .filter((patent) => patent.projectId === projectId)
    .map(hydratePatentReference)
    .sort((a, b) => +new Date(b.pinnedAt) - +new Date(a.pinnedAt));

  const collections = store.collections
    .filter((collection) => collection.projectId === projectId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const comments = store.comments
    .filter((comment) => comment.projectId === projectId)
    .map((comment) => ({ ...comment, author: usersById.get(comment.authorId) }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const shares = store.shares
    .filter((share) => share.projectId === projectId)
    .map((share) => ({ ...share, user: usersById.get(share.userId ?? -1) }))
    .sort((a, b) => +new Date(a.grantedAt) - +new Date(b.grantedAt));

  return {
    project: computeProjectStats(store, project),
    searches,
    pinnedPatents,
    collections,
    comments,
    shares,
  };
}

export async function listProjects() {
  return withStore((store) => ({
    projects: store.projects
      .filter((project) => !project.archivedAt)
      .map((project) => computeProjectStats(store, project))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
  }));
}

export async function createProject(input: CreateProjectInput) {
  return withStore((store) => {
    const timestamp = nowIso();
    const project: Project = {
      id: nextId(store, 'project'),
      ownerId: CURRENT_USER_ID,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      defaultProvider: input.defaultProvider,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    };

    store.projects.push(project);
    store.shares.push({
      id: nextId(store, 'share'),
      projectId: project.id,
      userId: CURRENT_USER_ID,
      role: 'OWNER',
      grantedAt: timestamp,
      user: store.users.find((user) => user.id === CURRENT_USER_ID),
    });

    return project;
  });
}

export async function updateProject(projectId: number, input: UpdateProjectInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    project.name = input.name.trim();
    project.description = input.description?.trim() || undefined;
    project.defaultProvider = input.defaultProvider;
    project.updatedAt = nowIso();
    return project;
  });
}

export async function deleteProject(projectId: number) {
  return withStore((store) => {
    store.projects = store.projects.filter((project) => project.id !== projectId);
    store.searches = store.searches.filter((search) => search.projectId !== projectId);
    store.patents = store.patents.filter((patent) => patent.projectId !== projectId);
    store.collections = store.collections.filter((collection) => collection.projectId !== projectId);
    store.comments = store.comments.filter((comment) => comment.projectId !== projectId);
    store.shares = store.shares.filter((share) => share.projectId !== projectId);
    return { success: true };
  });
}

export async function archiveProject(projectId: number) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    project.archivedAt = nowIso();
    project.updatedAt = nowIso();
    return project;
  });
}

export async function getProjectDetail(projectId: number) {
  return withStore((store) => projectDetailPayload(store, projectId));
}

export async function saveSearchToProject(projectId: number, input: SaveSearchInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    const timestamp = nowIso();
    const cachedStats = {
      topAssignees: input.cachedStats?.topAssignees ?? [],
      filingTrend: input.cachedStats?.filingTrend ?? [],
      technologyDistribution: input.cachedStats?.technologyDistribution ?? [],
    };
    const filingYears = input.cachedResults
      .map((patent) => Number.parseInt(patent.filingDate.slice(0, 4), 10))
      .filter((year) => Number.isFinite(year));

    const search: SavedSearch = {
      id: nextId(store, 'search'),
      projectId,
      queryString: input.queryString,
      parsedQuery: input.parsedQuery,
      providers: input.providers,
      filters: input.filters || {},
      resultCount: input.cachedResults.length,
      earliestFilingYear: filingYears.length ? Math.min(...filingYears) : undefined,
      latestFilingYear: filingYears.length ? Math.max(...filingYears) : undefined,
      runAt: timestamp,
      createdAt: timestamp,
      watchFrequency: normalizeWatchFrequency(input.watchFrequency),
      alertRunCount: 0,
      newSinceLastRun: 0,
      lastAlertResultCount: input.cachedResults.length,
      notes: input.notes,
      cachedStats,
    };

    store.searches.push(search);
    project.updatedAt = timestamp;
    return search;
  });
}

export async function deleteSavedSearch(projectId: number, searchId: number) {
  return withStore((store) => {
    const before = store.searches.length;
    store.searches = store.searches.filter(
      (search) => !(search.projectId === projectId && search.id === searchId)
    );
    if (before === store.searches.length) throw new Error('Saved search not found');
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return { success: true };
  });
}

export async function updateSavedSearchWatchFrequency(
  projectId: number,
  searchId: number,
  input: UpdateSavedSearchWatchFrequencyInput
) {
  return withStore((store) => {
    const search = store.searches.find(
      (entry) => entry.projectId === projectId && entry.id === searchId
    );
    if (!search) throw new Error('Saved search not found');

    search.watchFrequency = normalizeWatchFrequency(input.watchFrequency);
    if (search.watchFrequency === 'NONE') {
      search.lastAlertRunAt = undefined;
      search.alertRunCount = 0;
      search.newSinceLastRun = 0;
      search.lastAlertResultCount = search.resultCount;
    }

    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return search;
  });
}

export async function triggerSavedSearchAlert(projectId: number, searchId: number) {
  return withStore((store) => {
    const search = store.searches.find(
      (entry) => entry.projectId === projectId && entry.id === searchId
    );
    if (!search) throw new Error('Saved search not found');

    const previousCount = search.lastAlertResultCount ?? search.resultCount;
    const simulatedNewCount = Math.max(1, Math.ceil(search.resultCount * 0.1));

    search.lastAlertRunAt = nowIso();
    search.alertRunCount = (search.alertRunCount || 0) + 1;
    search.lastAlertResultCount = search.resultCount;
    search.newSinceLastRun = Math.max(0, search.resultCount - previousCount) || simulatedNewCount;

    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();

    return { search, simulatedNewCount };
  });
}

export async function addProjectComment(projectId: number, input: AddCommentInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    const timestamp = nowIso();
    const comment: Comment = {
      id: nextId(store, 'comment'),
      authorId: CURRENT_USER_ID,
      projectId,
      resourceType: input.resourceType || 'project',
      resourceId: input.resourceId,
      content: input.content,
      createdAt: timestamp,
      updatedAt: timestamp,
      author: store.users.find((user) => user.id === CURRENT_USER_ID),
    };

    store.comments.push(comment);
    project.updatedAt = timestamp;
    return comment;
  });
}

export async function deleteProjectComment(projectId: number, commentId: number) {
  return withStore((store) => {
    const before = store.comments.length;
    store.comments = store.comments.filter(
      (comment) => !(comment.projectId === projectId && comment.id === commentId)
    );
    if (before === store.comments.length) throw new Error('Comment not found');
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return { success: true };
  });
}

export async function addProjectShare(projectId: number, input: AddShareInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    const user = getOrCreateUserByEmail(store, input.userEmail);
    const existing = store.shares.find(
      (share) => share.projectId === projectId && share.userId === user.id
    );

    if (existing) {
      existing.role = input.role;
      existing.grantedAt = nowIso();
      existing.user = user;
      project.updatedAt = nowIso();
      return existing;
    }

    const share: ProjectShare = {
      id: nextId(store, 'share'),
      projectId,
      userId: user.id,
      role: input.role,
      grantedAt: nowIso(),
      user,
    };

    store.shares.push(share);
    project.updatedAt = nowIso();
    return share;
  });
}

export async function removeProjectShare(projectId: number, shareId: number) {
  return withStore((store) => {
    const target = store.shares.find(
      (share) => share.id === shareId && share.projectId === projectId
    );
    if (!target) throw new Error('Share not found');
    if (target.userId === CURRENT_USER_ID) throw new Error('Cannot remove project owner');

    store.shares = store.shares.filter((share) => share.id !== shareId);
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return { success: true };
  });
}

export async function updateProjectShareRole(
  projectId: number,
  shareId: number,
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
) {
  return withStore((store) => {
    const share = store.shares.find((entry) => entry.id === shareId && entry.projectId === projectId);
    if (!share) throw new Error('Share not found');
    if (share.userId === CURRENT_USER_ID) throw new Error('Cannot change owner role');

    share.role = role;
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return share;
  });
}

export async function deletePinnedPatent(projectId: number, patentReferenceId: number) {
  return withStore((store) => {
    const before = store.patents.length;
    store.patents = store.patents.filter(
      (patent) => !(patent.projectId === projectId && patent.id === patentReferenceId)
    );
    if (before === store.patents.length) throw new Error('Pinned patent not found');
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return { success: true };
  });
}

export async function listProjectCollections(projectId: number) {
  return withStore((store) => ({
    collections: store.collections
      .filter((collection) => collection.projectId === projectId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  }));
}

export async function createProjectCollection(projectId: number, input: CreateCollectionInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    const collection: Collection = {
      id: nextId(store, 'collection'),
      projectId,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      createdAt: nowIso(),
    };
    store.collections.push(collection);
    project.updatedAt = nowIso();
    return collection;
  });
}

export async function pinPatentToProject(projectId: number, input: PinPatentInput) {
  return withStore((store) => {
    const project = getProjectOrThrow(store, projectId);
    const collectionExists =
      input.collectionId === undefined ||
      store.collections.some(
        (collection) => collection.id === input.collectionId && collection.projectId === projectId
      );
    if (!collectionExists) throw new Error('Collection not found');

    const patentReference: PatentReference = {
      id: nextId(store, 'patent'),
      projectId,
      patentId: input.patent.id,
      patentData: {
        patentNumber: input.patent.patentNumber,
        title: input.patent.title,
        assignee: input.patent.assignee,
        abstract: input.patent.abstract,
        independentClaims: input.patent.independentClaims,
        dependentClaimsSummary: input.patent.dependentClaimsSummary,
        filingDate: input.patent.filingDate,
        grantDate: input.patent.grantDate,
        inventors: input.patent.inventors,
        provider: input.patent.provider,
        url: input.patent.url,
        legalStatus: input.patent.legalStatus,
        familyId: input.patent.familyId,
        isFamilyRepresentative: input.patent.isFamilyRepresentative,
        familySize: input.patent.familySize,
      },
      pinnedAt: nowIso(),
      status: 'TO_REVIEW',
      notes: input.notes,
      collectionIds: input.collectionId ? [input.collectionId] : [],
    };

    store.patents.push(patentReference);
    project.updatedAt = nowIso();
    return patentReference;
  });
}

export async function updatePatentReviewStatus(
  projectId: number,
  patentReferenceId: number,
  input: UpdatePatentReviewStatusInput
) {
  return withStore((store) => {
    const patent = store.patents.find(
      (entry) => entry.projectId === projectId && entry.id === patentReferenceId
    );
    if (!patent) throw new Error('Pinned patent not found');
    patent.status = input.status;
    patent.statusReason = input.statusReason?.trim() || undefined;
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return patent;
  });
}

export async function bulkUpdatePatentReviewStatus(
  projectId: number,
  input: BulkUpdatePatentReviewStatusInput
) {
  return withStore((store) => {
    const updated: PatentReference[] = [];
    input.patentReferenceIds.forEach((patentReferenceId) => {
      const patent = store.patents.find(
        (entry) => entry.projectId === projectId && entry.id === patentReferenceId
      );
      if (patent) {
        patent.status = input.status;
        patent.statusReason = input.statusReason?.trim() || undefined;
        updated.push(patent);
      }
    });
    const project = store.projects.find((entry) => entry.id === projectId);
    if (project) project.updatedAt = nowIso();
    return updated;
  });
}

export async function compareSavedSearches(
  projectId: number,
  searchIds: number[]
): Promise<SearchComparisonResponse> {
  return withStore((store) => {
    const searches = store.searches
      .filter((search) => search.projectId === projectId && searchIds.includes(search.id))
      .map(hydrateSearch);

    const mergedTimelineMap = new Map<number, Record<string, number>>();
    const assigneeMap = new Map<string, Record<string, number>>();

    searches.forEach((search) => {
      (search.cachedStats?.filingTrend || []).forEach((point) => {
        const existing = mergedTimelineMap.get(point.year) || {};
        existing[String(search.id)] = point.count;
        mergedTimelineMap.set(point.year, existing);
      });

      (search.cachedStats?.topAssignees || []).forEach((item) => {
        const existing = assigneeMap.get(item.name) || {};
        existing[String(search.id)] = item.count;
        assigneeMap.set(item.name, existing);
      });
    });

    const mergedTimeline = Array.from(mergedTimelineMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, values]) => ({ year, ...values }));

    const assigneeComparison = Array.from(assigneeMap.entries()).map(([assigneeName, values]) => ({
      assigneeName,
      ...values,
    }));

    const sharedAssignees = searches.length
      ? Array.from(new Set(searches[0].cachedStats?.topAssignees?.map((item) => item.name) || [])).filter(
          (name) =>
            searches.slice(1).every((search) =>
              (search.cachedStats?.topAssignees || []).some((item) => item.name === name)
            )
        )
      : [];

    const firstClasses = new Set(
      searches[0]?.cachedStats?.technologyDistribution?.map((item) => item.class) || []
    );
    const sharedCpcClasses = searches.length
      ? Array.from(firstClasses).filter((cpc) =>
          searches.slice(1).every((search) =>
            (search.cachedStats?.technologyDistribution || []).some((item) => item.class === cpc)
          )
        )
      : [];

    const overlapBase = searches.reduce((sum, search) => sum + Math.max(search.resultCount, 1), 0);
    const estimatedOverlapPercentage = overlapBase
      ? Math.min(100, Math.round((sharedAssignees.length * 100) / overlapBase))
      : 0;

    return {
      searches: searches.map((search) => ({
        id: search.id,
        queryString: search.queryString,
        resultCount: search.resultCount,
        earliestFilingYear: search.earliestFilingYear,
        latestFilingYear: search.latestFilingYear,
      })),
      mergedTimeline,
      assigneeComparison,
      overlap: {
        sharedAssignees,
        sharedCpcClasses,
        estimatedOverlapPercentage,
      },
      statistics: searches.reduce((acc, search) => {
        const earliest = search.earliestFilingYear ?? 0;
        const latest = search.latestFilingYear ?? earliest;
        acc[String(search.id)] = {
          avgFilingYear: earliest && latest ? (earliest + latest) / 2 : 0,
          medianFilingYear: earliest && latest ? (earliest + latest) / 2 : 0,
        };
        return acc;
      }, {} as SearchComparisonResponse['statistics']),
    };
  });
}

export async function getSearchForExport(projectId: number, searchId: number) {
  return withStore((store) => {
    const search = store.searches.find(
      (entry) => entry.projectId === projectId && entry.id === searchId
    );
    if (!search) throw new Error('Saved search not found');
    return hydrateSearch(search);
  });
}

export async function getPatentsForExport(projectId: number) {
  return withStore((store) =>
    store.patents.filter((patent) => patent.projectId === projectId).map(hydratePatentReference)
  );
}

export function __resetProjectStoreForTests() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
