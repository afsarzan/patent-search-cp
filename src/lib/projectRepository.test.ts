import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetProjectStoreForTests,
  addProjectComment,
  addProjectShare,
  createProject,
  getProjectDetail,
  listProjects,
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
});
