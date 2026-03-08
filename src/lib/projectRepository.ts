import { Patent, PatentProvider } from '@/lib/patentApi';
import {
  Comment,
  Collection,
  PatentReference,
  Project,
  ProjectShare,
  SearchComparisonResponse,
  SavedSearch,
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

interface SaveSearchInput {
  queryString: string;
  providers: PatentProvider[];
  filters?: Record<string, unknown>;
  cachedResults: Patent[];
  cachedStats?: Record<string, unknown>;
  notes?: string;
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

function readStore(): ProjectStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createInitialState();
    writeStore(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as ProjectStore;
    return {
      ...createInitialState(),
      ...parsed,
    };
  } catch {
    const initial = createInitialState();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: ProjectStore) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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

  const newUser: User = {
    id: nextId(store, 'user'),
    email: normalized,
    name: normalized.split('@')[0] || 'Teammate',
    createdAt: nowIso(),
  };
  store.users.push(newUser);
  return newUser;
}

export async function listProjects() {
  const projects = withStore((store) =>
    store.projects
      .filter((project) => !project.archivedAt)
      .map((project) => computeProjectStats(store, project))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  );
  return { projects };
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

    const ownerShare: ProjectShare = {
      id: nextId(store, 'share'),
      projectId: project.id,
      userId: CURRENT_USER_ID,
      role: 'OWNER',
      grantedAt: timestamp,
      user: store.users.find((u) => u.id === CURRENT_USER_ID),
    };
    store.shares.push(ownerShare);

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
    const project = store.projects.find((entry) => entry.id === projectId);
    if (!project) throw new Error('Project not found');
    project.archivedAt = nowIso();
    project.updatedAt = nowIso();
    return project;
  });
}

export async function getProjectDetail(projectId: number) {
  const data = withStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) return null;

    const searches = store.searches
      .filter((search) => search.projectId === projectId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    const pinnedPatents = store.patents.filter((patent) => patent.projectId === projectId);
    const collections = store.collections.filter((collection) => collection.projectId === projectId);
    const comments = store.comments
      .filter((comment) => comment.projectId === projectId)
      .map((comment) => ({
        ...comment,
        author: store.users.find((user) => user.id === comment.authorId),
      }))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    const shares = store.shares
      .filter((share) => share.projectId === projectId)
      .map((share) => ({ ...share, user: store.users.find((user) => user.id === share.userId) }))
      .sort((a, b) => +new Date(a.grantedAt) - +new Date(b.grantedAt));

    return {
      project: computeProjectStats(store, project),
      searches,
      pinnedPatents,
      collections,
      comments,
      shares,
    };
  });

  if (!data) {
    throw new Error('Project not found');
  }

  return data;
}

export async function saveSearchToProject(projectId: number, input: SaveSearchInput) {
  return withStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) throw new Error('Project not found');

    const timestamp = nowIso();
    const filingYears = input.cachedResults
      .map((patent) => Number.parseInt(patent.filingDate.slice(0, 4), 10))
      .filter((year) => Number.isFinite(year));

    const savedSearch: SavedSearch = {
      id: nextId(store, 'search'),
      projectId,
      queryString: input.queryString,
      providers: input.providers,
      filters: input.filters || {},
      resultCount: input.cachedResults.length,
      earliestFilingYear: filingYears.length ? Math.min(...filingYears) : undefined,
      latestFilingYear: filingYears.length ? Math.max(...filingYears) : undefined,
      runAt: timestamp,
      createdAt: timestamp,
      notes: input.notes,
      cachedStats: {
        topAssignees: [],
        filingTrend: [],
        technologyDistribution: [],
      },
    };

    store.searches.push(savedSearch);
    project.updatedAt = timestamp;

    return savedSearch;
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

export async function addProjectComment(projectId: number, input: AddCommentInput) {
  return withStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) throw new Error('Project not found');

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
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) throw new Error('Project not found');

    const user = getOrCreateUserByEmail(store, input.userEmail);
    const existing = store.shares.find(
      (share) => share.projectId === projectId && share.userId === user.id
    );

    if (existing) {
      existing.role = input.role;
      existing.grantedAt = nowIso();
      existing.user = user;
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
  const collections = withStore((store) =>
    store.collections
      .filter((collection) => collection.projectId === projectId)
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  return { collections };
}

export async function createProjectCollection(projectId: number, input: CreateCollectionInput) {
  return withStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) throw new Error('Project not found');

    const existing = store.collections.find(
      (collection) =>
        collection.projectId === projectId &&
        collection.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );

    if (existing) return existing;

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
    const project = store.projects.find((entry) => entry.id === projectId && !entry.archivedAt);
    if (!project) throw new Error('Project not found');

    const existing = store.patents.find(
      (patent) => patent.projectId === projectId && patent.patentId === input.patent.patentNumber
    );

    if (existing) {
      if (input.notes?.trim()) {
        existing.notes = input.notes.trim();
      }

      if (input.collectionId) {
        const nextCollectionIds = new Set(existing.collectionIds || []);
        nextCollectionIds.add(input.collectionId);
        existing.collectionIds = Array.from(nextCollectionIds);
      }

      project.updatedAt = nowIso();
      return existing;
    }

    const reference: PatentReference = {
      id: nextId(store, 'patent'),
      projectId,
      patentId: input.patent.patentNumber,
      patentData: {
        patentNumber: input.patent.patentNumber,
        title: input.patent.title,
        assignee: input.patent.assignee,
        abstract: input.patent.abstract,
        filingDate: input.patent.filingDate,
        grantDate: input.patent.grantDate,
        inventors: input.patent.inventors,
        provider: input.patent.provider,
        url: input.patent.url,
      },
      pinnedAt: nowIso(),
      notes: input.notes?.trim() || undefined,
      collectionIds: input.collectionId ? [input.collectionId] : undefined,
    };

    store.patents.push(reference);
    project.updatedAt = nowIso();

    return reference;
  });
}

export async function compareSavedSearches(
  projectId: number,
  searchIds: number[]
): Promise<SearchComparisonResponse> {
  return withStore((store) => {
    const searches = store.searches.filter(
      (search) => search.projectId === projectId && searchIds.includes(search.id)
    );

    const mergedTimelineMap = new Map<number, Record<string, number>>();

    searches.forEach((search) => {
      const trend = search.cachedStats?.filingTrend || [];
      trend.forEach((point) => {
        const existing = mergedTimelineMap.get(point.year) || {};
        existing[String(search.id)] = point.count;
        mergedTimelineMap.set(point.year, existing);
      });
    });

    const mergedTimeline = Array.from(mergedTimelineMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, values]) => ({ year, ...values }));

    const assigneeCounter = new Map<string, Record<string, number>>();
    searches.forEach((search) => {
      const topAssignees = search.cachedStats?.topAssignees || [];
      topAssignees.forEach((item) => {
        const key = item.name;
        const existing = assigneeCounter.get(key) || {};
        existing[String(search.id)] = item.count;
        assigneeCounter.set(key, existing);
      });
    });

    const assigneeComparison = Array.from(assigneeCounter.entries()).map(([assigneeName, values]) => ({
      assigneeName,
      ...values,
    }));

    const firstClasses = new Set(
      (searches[0]?.cachedStats?.technologyDistribution || []).map((entry) => entry.class)
    );
    const sharedCpcClasses = searches.length <= 1
      ? Array.from(firstClasses)
      : Array.from(firstClasses).filter((cpc) =>
          searches.slice(1).every((search) =>
            (search.cachedStats?.technologyDistribution || []).some((entry) => entry.class === cpc)
          )
        );

    const assigneeSets = searches.map(
      (search) => new Set((search.cachedStats?.topAssignees || []).map((entry) => entry.name))
    );
    const sharedAssignees = assigneeSets.length <= 1
      ? Array.from(assigneeSets[0] || [])
      : Array.from(assigneeSets[0]).filter((name) => assigneeSets.slice(1).every((set) => set.has(name)));

    const overlapBase = searches.reduce((sum, search) => sum + Math.max(search.resultCount, 1), 0);
    const overlapEstimate = overlapBase
      ? Math.round((sharedAssignees.length * 100) / overlapBase)
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
        estimatedOverlapPercentage: overlapEstimate,
      },
      statistics: searches.reduce(
        (acc, search) => {
          const earliest = search.earliestFilingYear || 0;
          const latest = search.latestFilingYear || earliest;
          const avg = earliest && latest ? (earliest + latest) / 2 : 0;
          acc[String(search.id)] = {
            avgFilingYear: avg,
            medianFilingYear: avg,
          };
          return acc;
        },
        {} as SearchComparisonResponse['statistics']
      ),
    };
  });
}

export function __resetProjectStoreForTests() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
