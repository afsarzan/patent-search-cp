import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('submits trimmed query text', () => {
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText('Enter a topic, keyword, or technology...');
    const button = screen.getByRole('button', { name: 'Search Patents' });

    fireEvent.change(input, { target: { value: '  quantum computing  ' } });
    fireEvent.click(button);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('quantum computing');
  });

  it('keeps submit disabled while loading', () => {
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} isLoading />);

    const button = screen.getByRole('button', { name: /Searching/i });
    expect(button).toBeDisabled();
  });
});
