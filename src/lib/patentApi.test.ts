import { describe, expect, it } from 'vitest';
import { parsePatentQuery, searchAllProviders, searchPatents } from './patentApi';

describe('parsePatentQuery', () => {
  it('parses quoted phrases, boolean operators, and fielded terms', () => {
    const parsed = parsePatentQuery('"solid state battery" AND assignee:toyota');

    expect(parsed.valid).toBe(true);
    if (parsed.valid) {
      expect(parsed.parsed.ast.type).toBe('binary');
    }
  });

  it('returns an inline-safe validation error for malformed syntax', () => {
    const parsed = parsePatentQuery('(graphene OR silicon');

    expect(parsed.valid).toBe(false);
    if (!parsed.valid) {
      expect(parsed.error).toContain('closing parenthesis');
    }
  });
});

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

  it('filters by legal status', async () => {
    const grantedResult = await searchPatents('assignee:google', 'USPTO', 1, 25, {
      legalStatuses: ['GRANTED'],
    });
    const expiredResult = await searchPatents('assignee:google', 'USPTO', 1, 25, {
      legalStatuses: ['EXPIRED'],
    });

    expect(grantedResult.total).toBe(1);
    expect(grantedResult.patents[0]?.legalStatus).toBe('GRANTED');
    expect(expiredResult.total).toBe(0);
  });

  it('honors fielded terms and AND operator', async () => {
    const result = await searchPatents('title:transformer AND assignee:google', 'USPTO');

    expect(result.total).toBe(1);
    expect(result.patents[0]?.assignee).toContain('Google');
    expect(result.patents[0]?.title.toLowerCase()).toContain('transformer');
  });

  it('honors OR and NOT operators with implicit AND', async () => {
    const orResult = await searchPatents('assignee:tesla OR assignee:google', 'USPTO');
    const notResult = await searchPatents('assignee:tesla NOT abstract:urban', 'USPTO');

    expect(orResult.total).toBe(2);
    expect(notResult.total).toBe(0);
  });

  it('returns parse errors for invalid boolean syntax', async () => {
    const result = await searchPatents('(assignee:tesla OR assignee:google', 'USPTO');

    expect(result.total).toBe(0);
    expect(result.error).toContain('closing parenthesis');
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

  it('applies legal status filters across providers', async () => {
    const result = await searchAllProviders('battery', {
      legalStatuses: ['GRANTED'],
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.patents.every((patent) => patent.legalStatus === 'GRANTED')).toBe(true);
  });
});
