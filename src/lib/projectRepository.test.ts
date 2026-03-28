import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetProjectStoreForTests,
  addProjectComment,
  addProjectShare,
  createProjectCollection,
  createProject,
  getProjectDetail,
  listProjects,
  updateProject,
  pinPatentToProject,
  saveSearchToProject,
} from './projectRepository';

describe('projectRepository', () => {
  beforeEach(() => {
    __resetProjectStoreForTests();
  });

  it('creates project and includes it in project listing', async () => {
    await createProject({
      name: 'AI Patent Watch',
      description: 'Track emerging AI inventions',
      defaultProvider: 'USPTO',
    });

    const { projects } = await listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('AI Patent Watch');
    expect(projects[0].searchCount).toBe(0);
    expect(projects[0].teamSize).toBe(1);
  });

  it('saves a search and exposes it in project detail with computed years', async () => {
    const project = await createProject({ name: 'Battery Research' });

    await saveSearchToProject(project.id, {
      queryString: 'solid state battery',
      parsedQuery: {
        raw: 'solid state battery',
        normalized: 'solid state battery',
        ast: {
          type: 'term',
          value: 'solid state battery',
        },
      },
      providers: ['USPTO'],
      cachedResults: [
        {
          id: '1',
          patentNumber: 'US-1',
          title: 'Battery cell architecture',
          abstract: 'High density battery design',
          inventors: ['Jane Doe'],
          assignee: 'Example Energy',
          filingDate: '2020-03-10',
          grantDate: '2022-04-10',
          url: 'https://patents.google.com/patent/US1',
          provider: 'USPTO',
        },
        {
          id: '2',
          patentNumber: 'US-2',
          title: 'Electrolyte formulation',
          abstract: 'Improves safety and throughput',
          inventors: ['John Doe'],
          assignee: 'Example Energy',
          filingDate: '2022-07-18',
          grantDate: '2024-01-11',
          url: 'https://patents.google.com/patent/US2',
          provider: 'USPTO',
        },
      ],
      notes: 'Baseline query',
    });

    const detail = await getProjectDetail(project.id);

    expect(detail.searches).toHaveLength(1);
    expect(detail.searches[0].queryString).toBe('solid state battery');
    expect(detail.searches[0].parsedQuery).toEqual({
      raw: 'solid state battery',
      normalized: 'solid state battery',
      ast: {
        type: 'term',
        value: 'solid state battery',
      },
    });
    expect(detail.searches[0].earliestFilingYear).toBe(2020);
    expect(detail.searches[0].latestFilingYear).toBe(2022);
  });

  it('persists comments and collaborators in project detail', async () => {
    const project = await createProject({ name: 'Collaboration Project' });

    await addProjectComment(project.id, { content: 'Initial findings posted.' });
    await addProjectShare(project.id, {
      userEmail: 'teammate@example.com',
      role: 'EDITOR',
    });

    const detail = await getProjectDetail(project.id);

    expect(detail.comments).toHaveLength(1);
    expect(detail.comments[0].content).toContain('Initial findings');
    expect(detail.shares.length).toBeGreaterThanOrEqual(2);
    expect(detail.shares.some((share) => share.user?.email === 'teammate@example.com')).toBe(true);
  });

  it('pins a patent to a project and attaches a collection', async () => {
    const project = await createProject({ name: 'Pinning Project' });
    const collection = await createProjectCollection(project.id, { name: 'Core Prior Art' });

    await pinPatentToProject(project.id, {
      patent: {
        id: 'abc-123',
        patentNumber: 'US1234567',
        title: 'Thermal management layer',
        abstract: 'A method for passive heat dissipation.',
        inventors: ['Alice Smith'],
        assignee: 'HeatTech Labs',
        filingDate: '2021-05-20',
        grantDate: '2024-02-12',
        url: 'https://patents.google.com/patent/US1234567',
        provider: 'USPTO',
      },
      notes: 'Relevant to baseline architecture',
      collectionId: collection.id,
    });

    const detail = await getProjectDetail(project.id);

    expect(detail.pinnedPatents).toHaveLength(1);
    expect(detail.collections).toHaveLength(1);
    expect(detail.pinnedPatents[0].patentData.url).toContain('US1234567');
    expect(detail.pinnedPatents[0].collectionIds).toContain(collection.id);
  });

  it('updates project settings metadata', async () => {
    const project = await createProject({
      name: 'Original Name',
      description: 'Original description',
      defaultProvider: 'USPTO',
    });

    await updateProject(project.id, {
      name: 'Updated Name',
      description: 'Updated description',
      defaultProvider: 'EPO',
    });

    const detail = await getProjectDetail(project.id);

    expect(detail.project.name).toBe('Updated Name');
    expect(detail.project.description).toBe('Updated description');
    expect(detail.project.defaultProvider).toBe('EPO');
  });
});
