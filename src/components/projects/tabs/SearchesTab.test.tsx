import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SearchesTab } from './SearchesTab';
import { SavedSearch } from '@/types/projects';

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
});