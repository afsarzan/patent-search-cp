import { describe, expect, it } from 'vitest';
import { searchAllProviders, searchPatents } from './patentApi';

describe('searchPatents', () => {
  it('returns no results when query has no matches', async () => {
    const result = await searchPatents('zzzz-no-match-12345', 'USPTO');

    expect(result.total).toBe(0);
    expect(result.patents).toEqual([]);
    expect(result.provider).toBe('USPTO');
  });

  it('paginates matched results while keeping total count', async () => {
    const pageOne = await searchPatents('a', 'USPTO', 1, 3);
    const pageTwo = await searchPatents('a', 'USPTO', 2, 3);

    expect(pageOne.total).toBeGreaterThan(3);
    expect(pageOne.patents).toHaveLength(3);
    expect(pageTwo.patents).toHaveLength(3);
    expect(pageOne.patents[0]?.id).not.toBe(pageTwo.patents[0]?.id);
  });

  it('normalizes invalid page and perPage values', async () => {
    const result = await searchPatents('a', 'EPO', 0, 0);

    expect(result.patents).toHaveLength(1);
    expect(result.total).toBeGreaterThan(0);
  });
});

describe('searchAllProviders', () => {
  it('returns no results when query has no matches', async () => {
    const result = await searchAllProviders('zzzz-no-match-67890');

    expect(result.total).toBe(0);
    expect(result.patents).toEqual([]);
    expect(result.provider).toBe('Google Patents');
  });
});
