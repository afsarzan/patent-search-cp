import { describe, it, expect } from 'vitest';
import {
  exportSearchToCSV,
  exportSearchToJSON,
  exportPatentsToCSV,
  exportPatentsToJSON,
} from './exporters';
import { SavedSearch, PatentReference } from '@/types/projects';

describe('Exporters', () => {
  describe('CSV Export', () => {
    it('exports search to CSV with correct headers and metadata', () => {
      const search: SavedSearch = {
        id: 1,
        projectId: 1,
        queryString: 'battery AND graphene',
        providers: ['USPTO', 'EPO'],
        filters: { filingDateRange: '2020-2024' },
        resultCount: 5,
        runAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-15T09:00:00Z',
        watchFrequency: 'DAILY',
      };

      const csv = exportSearchToCSV(search, []);

      expect(csv).toContain('PATENT SEARCH EXPORT');
      expect(csv).toContain('battery AND graphene');
      expect(csv).toContain('USPTO;EPO');
      expect(csv).toContain('5');
      expect(csv).toContain('RESULTS');
      expect(csv).toContain('Patent Number');
      expect(csv).toContain('Title');
      expect(csv).toContain('Assignee');
    });

    it('exports patents with correct CSV formatting and escaping', () => {
      const patents: PatentReference[] = [
        {
          id: 1,
          projectId: 1,
          patentId: 'US10123456B2',
          patentData: {
            patentNumber: 'US10123456B2',
            title: 'Battery with "special" characters',
            assignee: 'Toyota Motor Corp',
            inventors: ['John Doe', 'Jane Smith'],
            abstract: 'A new battery,with, commas',
            filingDate: '2020-01-15',
            grantDate: '2022-03-20',
            provider: 'USPTO',
            legalStatus: 'GRANTED',
            url: 'https://patents.google.com/patent/US10123456B2',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'RELEVANT',
          statusReason: 'Highly relevant to claim 1',
          notes: 'Key prior art',
        },
      ];

      const csv = exportPatentsToCSV(patents);

      expect(csv).toContain('PINNED PATENTS EXPORT');
      expect(csv).toContain('US10123456B2');
      expect(csv).toContain('"Battery with ""special"" characters"');
      expect(csv).toContain('RELEVANT');
      expect(csv).toContain('Highly relevant to claim 1');
      expect(csv).toContain('Key prior art');
    });

    it('handles special characters in CSV export', () => {
      const patents: PatentReference[] = [
        {
          id: 1,
          projectId: 1,
          patentId: 'EP1234567',
          patentData: {
            patentNumber: 'EP1234567',
            title: 'Method for processing,data with "quotes"',
            assignee: 'Company, Inc.',
            inventors: ['Test\nDoe'],
            abstract: 'Abstract line 1\nline 2',
            filingDate: '2020-01-15',
            grantDate: '2022-03-20',
            provider: 'EPO',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'TO_REVIEW',
        },
      ];

      const csv = exportPatentsToCSV(patents);

      expect(csv).toContain('"Method for processing,data with ""quotes"""');
      expect(csv).toContain('"Company, Inc."');
    });
  });

  describe('JSON Export', () => {
    it('exports search to JSON with complete metadata', () => {
      const search: SavedSearch = {
        id: 2,
        projectId: 1,
        queryString: 'quantum computing',
        providers: ['USPTO', 'WIPO'],
        filters: { assignee: 'IBM' },
        resultCount: 10,
        runAt: '2024-03-16T14:30:00Z',
        createdAt: '2024-03-16T13:00:00Z',
        watchFrequency: 'WEEKLY',
        lastAlertRunAt: '2024-03-16T10:00:00Z',
        alertRunCount: 2,
      };

      const json = exportSearchToJSON(search, []);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('search');
      expect(parsed).toHaveProperty('patents');
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.search.queryString).toBe('quantum computing');
      expect(parsed.metadata.providers).toEqual(['USPTO', 'WIPO']);
      expect(parsed.metadata.patentCount).toBe(0);
      expect(parsed.metadata.reviewCount).toBe(0);
    });

    it('includes patent statistics in JSON metadata', () => {
      const search: SavedSearch = {
        id: 1,
        projectId: 1,
        queryString: 'AI',
        providers: ['Google Patents'],
        filters: {},
        resultCount: 2,
        runAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-15T09:00:00Z',
      };

      const patents: PatentReference[] = [
        {
          id: 1,
          projectId: 1,
          patentId: 'US001',
          patentData: {
            patentNumber: 'US001',
            title: 'AI Method 1',
            assignee: 'TechCorp',
            inventors: [],
            abstract: 'Abstract 1',
            filingDate: '2020-01-01',
            grantDate: '2021-01-01',
            provider: 'Google Patents',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'RELEVANT',
        },
        {
          id: 2,
          projectId: 1,
          patentId: 'US002',
          patentData: {
            patentNumber: 'US002',
            title: 'AI Method 2',
            assignee: 'AnotherCorp',
            inventors: [],
            abstract: 'Abstract 2',
            filingDate: '2020-02-01',
            grantDate: '2021-02-01',
            provider: 'Google Patents',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'KEY_PRIOR_ART',
        },
      ];

      const json = exportSearchToJSON(search, patents);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.patentCount).toBe(2);
      expect(parsed.metadata.reviewCount).toBe(2);
      expect(parsed.metadata.uniqueAssignees).toEqual(['AnotherCorp', 'TechCorp']);
    });

    it('exports patents to JSON with distribution stats', () => {
      const patents: PatentReference[] = [
        {
          id: 1,
          projectId: 1,
          patentId: 'US001',
          patentData: {
            patentNumber: 'US001',
            title: 'Patent 1',
            assignee: 'Corp A',
            inventors: [],
            abstract: 'Abstract',
            filingDate: '2020-01-01',
            grantDate: '2021-01-01',
            provider: 'USPTO',
            legalStatus: 'GRANTED',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'RELEVANT',
        },
        {
          id: 2,
          projectId: 1,
          patentId: 'US002',
          patentData: {
            patentNumber: 'US002',
            title: 'Patent 2',
            assignee: 'Corp B',
            inventors: [],
            abstract: 'Abstract',
            filingDate: '2020-02-01',
            grantDate: '2021-02-01',
            provider: 'USPTO',
            legalStatus: 'EXPIRED',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'RELEVANT',
        },
        {
          id: 3,
          projectId: 1,
          patentId: 'US003',
          patentData: {
            patentNumber: 'US003',
            title: 'Patent 3',
            assignee: 'Corp C',
            inventors: [],
            abstract: 'Abstract',
            filingDate: '2020-03-01',
            grantDate: '2021-03-01',
            provider: 'USPTO',
            legalStatus: 'EXPIRED',
          },
          pinnedAt: '2024-03-15T00:00:00Z',
          status: 'KEY_PRIOR_ART',
        },
      ];

      const json = exportPatentsToJSON(patents);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.totalCount).toBe(3);
      expect(parsed.metadata.reviewStatusDistribution).toEqual({
        RELEVANT: 2,
        KEY_PRIOR_ART: 1,
      });
      expect(parsed.metadata.legalStatusDistribution).toEqual({
        GRANTED: 1,
        EXPIRED: 2,
      });
    });
  });

  describe('Export Format Determinism', () => {
    it('generates consistent CSV output for same input', () => {
      const search: SavedSearch = {
        id: 1,
        projectId: 1,
        queryString: 'test query',
        providers: ['USPTO'],
        filters: {},
        resultCount: 0,
        runAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-15T09:00:00Z',
      };

      const csv1 = exportSearchToCSV(search, []);
      const csv2 = exportSearchToCSV(search, []);

      expect(csv1).toBe(csv2);
    });

    it('JSON export maintains object structure consistency', () => {
      const search: SavedSearch = {
        id: 1,
        projectId: 1,
        queryString: 'consistency test',
        providers: ['USPTO', 'EPO'],
        filters: { year: 2024 },
        resultCount: 5,
        runAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-15T09:00:00Z',
      };

      const json1 = exportSearchToJSON(search, []);
      const json2 = exportSearchToJSON(search, []);

      const parsed1 = JSON.parse(json1);
      const parsed2 = JSON.parse(json2);

      expect(parsed1.search.queryString).toBe(parsed2.search.queryString);
      expect(parsed1.metadata.providers).toEqual(parsed2.metadata.providers);
    });
  });

  describe('Empty Data Export', () => {
    it('handles export of empty search results', () => {
      const search: SavedSearch = {
        id: 1,
        projectId: 1,
        queryString: 'no results query',
        providers: ['USPTO'],
        filters: {},
        resultCount: 0,
        runAt: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-15T09:00:00Z',
      };

      const csv = exportSearchToCSV(search, []);
      const json = exportSearchToJSON(search, []);

      expect(csv).toContain('0');
      expect(csv).toContain('RESULTS');

      const parsed = JSON.parse(json);
      expect(parsed.metadata.patentCount).toBe(0);
    });

    it('handles export of empty patent list', () => {
      const csv = exportPatentsToCSV([]);
      const json = exportPatentsToJSON([]);

      expect(csv).toContain('PINNED PATENTS EXPORT');
      expect(csv).toContain('0');

      const parsed = JSON.parse(json);
      expect(parsed.metadata.totalCount).toBe(0);
      expect(parsed.patents).toEqual([]);
    });
  });
});
