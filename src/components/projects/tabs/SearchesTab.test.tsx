import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SearchesTab } from './SearchesTab';
import { SavedSearch } from '@/types/projects';
import { __resetProjectStoreForTests, createProject, getProjectDetail, saveSearchToProject } from '@/lib/projectRepository';

function renderWithQueryClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function makeSearch(id: number, queryString: string): SavedSearch {
  return {
    id,
    projectId: 1,
    queryString,
    providers: ['USPTO'],
    filters: {},
    resultCount: 10,
    runAt: '2026-03-21T00:00:00.000Z',
    createdAt: '2026-03-21T00:00:00.000Z',
  };
}

describe('SearchesTab', () => {
  beforeEach(() => {
    __resetProjectStoreForTests();
  });

  it('does not show compare button when no searches are selected', () => {
    renderWithQueryClient(
      <SearchesTab
        projectId={1}
        searches={[makeSearch(1, 'battery thermal'), makeSearch(2, 'solid-state battery')]}
        selectedSearchIds={[]}
        onSelectSearch={vi.fn()}
        onCompare={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Compare/i })).not.toBeInTheDocument();
  });

  it('shows compare button as disabled when only one search is selected', () => {
    renderWithQueryClient(
      <SearchesTab
        projectId={1}
        searches={[makeSearch(1, 'battery thermal'), makeSearch(2, 'solid-state battery')]}
        selectedSearchIds={[1]}
        onSelectSearch={vi.fn()}
        onCompare={vi.fn()}
      />
    );

    const compareButton = screen.getByRole('button', { name: 'Compare 1 Searches' });
    expect(compareButton).toBeDisabled();
  });

  it('calls onCompare with selected IDs when two or more searches are selected', () => {
    const onCompare = vi.fn();

    renderWithQueryClient(
      <SearchesTab
        projectId={1}
        searches={[makeSearch(1, 'battery thermal'), makeSearch(2, 'solid-state battery')]}
        selectedSearchIds={[1, 2]}
        onSelectSearch={vi.fn()}
        onCompare={onCompare}
      />
    );

    const compareButton = screen.getByRole('button', { name: 'Compare 2 Searches' });
    fireEvent.click(compareButton);

    expect(compareButton).toBeEnabled();
    expect(onCompare).toHaveBeenCalledTimes(1);
    expect(onCompare).toHaveBeenCalledWith([1, 2]);
  });

  it('updates watch frequency and shows alert metadata after a manual run', async () => {
    const project = await createProject({ name: 'Watchlist UI Test' });
    await saveSearchToProject(project.id, {
      queryString: 'battery thermal',
      providers: ['USPTO'],
      cachedResults: [
        {
          id: 'watch-ui-1',
          patentNumber: 'US-WATCH-UI-1',
          title: 'Watchlist UI patent',
          abstract: 'Baseline record for watchlist UI test.',
          inventors: ['Alex UI'],
          assignee: 'Example Assignee',
          filingDate: '2021-01-01',
          grantDate: '2023-01-01',
          url: 'https://patents.google.com/patent/USWATCHUI1',
          provider: 'USPTO',
        },
      ],
    });

    const detail = await getProjectDetail(project.id);
    const savedSearch = detail.searches[0];

    const onSelectSearch = vi.fn();

    renderWithQueryClient(
      <SearchesTab
        projectId={project.id}
        searches={[savedSearch]}
        selectedSearchIds={[]}
        onSelectSearch={onSelectSearch}
        onCompare={vi.fn()}
      />
    );

    fireEvent.change(screen.getByDisplayValue('No alerts'), { target: { value: 'DAILY' } });
    await waitFor(() => expect(screen.getByDisplayValue('Daily')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /run alert now/i }));

    await waitFor(() => expect(screen.getByText(/Last alert:/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/\+\d+ new/i)).toBeInTheDocument());
  });
});