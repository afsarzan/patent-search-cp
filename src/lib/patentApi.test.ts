import { describe, expect, it } from 'vitest';
import { searchAllProviders, searchPatents } from './patentApi';

describe('searchPatents', () => {
  it('returns no results when query has no matches', async () => {
    const result = await searchPatents('zzzz-no-match-12345', 'USPTO');

    expect(result.total).toBe(0);
    expect(result.patents).toEqual([]);
    expect(result.provider).toBe('USPTO');
    expect(result.facets.topAssignees).toEqual([]);
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

  it('applies filing date range filter', async () => {
    const result = await searchPatents('a', 'USPTO', 1, 25, {
      filingDateFrom: '2021-01-01',
      filingDateTo: '2021-12-31',
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.patents.every((patent) => patent.filingDate >= '2021-01-01' && patent.filingDate <= '2021-12-31')).toBe(true);
  });

  it('applies assignee contains filter', async () => {
    const result = await searchPatents('a', 'USPTO', 1, 25, {
      assigneeContains: 'Tesla',
    });

    expect(result.total).toBe(1);
    expect(result.patents[0]?.assignee).toContain('Tesla');
  });
});

describe('searchAllProviders', () => {
  it('returns no results when query has no matches', async () => {
    const result = await searchAllProviders('zzzz-no-match-67890');

    expect(result.total).toBe(0);
    expect(result.patents).toEqual([]);
    expect(result.provider).toBe('Google Patents');
    expect(result.facets.providerSplit).toEqual([]);
  });

  it('applies inventor and provider filters together', async () => {
    const result = await searchAllProviders('a', {
      inventorContains: 'chen',
      providers: ['USPTO', 'WIPO'],
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.patents.every((patent) => ['USPTO', 'WIPO'].includes(patent.provider))).toBe(true);
    expect(
      result.patents.every((patent) =>
        patent.inventors.some((inventor) => inventor.toLowerCase().includes('chen'))
      )
    ).toBe(true);
  });

  it('applies combined provider and grant date filters', async () => {
    const result = await searchAllProviders('a', {
      providers: ['EPO'],
      grantDateFrom: '2023-07-01',
      grantDateTo: '2023-12-31',
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.patents.every((patent) => patent.provider === 'EPO')).toBe(true);
    expect(
      result.patents.every((patent) => patent.grantDate >= '2023-07-01' && patent.grantDate <= '2023-12-31')
    ).toBe(true);
  });
});
