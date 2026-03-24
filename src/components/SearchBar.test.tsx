import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchBar } from './SearchBar';

const defaultProps = {
  filters: {},
  onFiltersChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe('SearchBar', () => {
  it('submits trimmed query text', () => {
    const onSearch = vi.fn();

    render(
      <SearchBar
        onSearch={onSearch}
        isLoading={false}
        filters={defaultProps.filters}
        onFiltersChange={defaultProps.onFiltersChange}
        onClearFilters={defaultProps.onClearFilters}
      />
    );

    const input = screen.getByPlaceholderText('Enter a topic, keyword, or technology...');
    const button = screen.getByRole('button', { name: 'Search Patents' });

    fireEvent.change(input, { target: { value: '  quantum computing  ' } });
    fireEvent.click(button);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('quantum computing', {});
  });

  it('keeps submit disabled while loading', () => {
    const onSearch = vi.fn();

    render(
      <SearchBar
        onSearch={onSearch}
        isLoading
        filters={defaultProps.filters}
        onFiltersChange={defaultProps.onFiltersChange}
        onClearFilters={defaultProps.onClearFilters}
      />
    );

    const button = screen.getByRole('button', { name: /Searching/i });
    expect(button).toBeDisabled();
  });

  it('enables clear all and triggers callback when filters are active', () => {
    const onSearch = vi.fn();
    const onClearFilters = vi.fn();

    render(
      <SearchBar
        onSearch={onSearch}
        isLoading={false}
        filters={{ assigneeContains: 'Toyota' }}
        onFiltersChange={vi.fn()}
        onClearFilters={onClearFilters}
      />
    );

    const clearButton = screen.getByRole('button', { name: 'Clear all' });
    expect(clearButton).toBeEnabled();

    fireEvent.click(clearButton);
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
