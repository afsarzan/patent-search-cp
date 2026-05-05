import { Patent } from '@/lib/patentApi';

export interface ExportMetadata {
  query?: string;
  total?: number;
  runDate?: string; // ISO
  provider?: string;
  notes?: string;
}

export function generatePatentsJSON(patents: Patent[], metadata?: ExportMetadata) {
  return JSON.stringify({ metadata: metadata || {}, patents }, null, 2);
}

function escapeCsvValue(value: any) {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generatePatentsCSV(patents: Patent[], metadata?: ExportMetadata) {
  const headers = [
    'patentNumber',
    'title',
    'assignee',
    'inventors',
    'abstract',
    'filingDate',
    'grantDate',
    'provider',
    'url',
    'legalStatus',
  ];

  const rows = patents.map((p) => [
    p.patentNumber,
    p.title,
    p.assignee,
    (p.inventors || []).join('; '),
    p.abstract,
    p.filingDate,
    p.grantDate,
    p.provider,
    p.url,
    p.legalStatus || '',
  ]);

  const lines: string[] = [];

  // optional metadata header block
  if (metadata) {
    lines.push(`# Export run: ${metadata.runDate || new Date().toISOString()}`);
    if (metadata.query) lines.push(`# Query: ${metadata.query}`);
    if (typeof metadata.total === 'number') lines.push(`# Total: ${metadata.total}`);
    if (metadata.provider) lines.push(`# Provider: ${metadata.provider}`);
    if (metadata.notes) lines.push(`# Notes: ${metadata.notes}`);
    lines.push('');
  }

  lines.push(headers.join(','));
  rows.forEach((row) => {
    lines.push(row.map(escapeCsvValue).join(','));
  });

  return lines.join('\n');
}

function downloadBlob(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPatentsAsJSON(patents: Patent[], metadata?: ExportMetadata, filename = 'patents-export.json') {
  const content = generatePatentsJSON(patents, metadata);
  downloadBlob(filename, content, 'application/json;charset=utf-8');
}

export function exportPatentsAsCSV(patents: Patent[], metadata?: ExportMetadata, filename = 'patents-export.csv') {
  const content = generatePatentsCSV(patents, metadata);
  downloadBlob(filename, content, 'text/csv;charset=utf-8');
}

export default {
  generatePatentsCSV,
  generatePatentsJSON,
  exportPatentsAsCSV,
  exportPatentsAsJSON,
};
import { SavedSearch, PatentReference } from '@/types/projects';
import { Patent } from './patentApi';

// CSV export helpers
function escapeCSV(value: string | number | boolean | undefined | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSVRow(values: Array<string | number | boolean | undefined | null>): string {
  return values.map(escapeCSV).join(',');
}

// JSON export helpers
interface SearchExportData {
  exportedAt: string;
  search: SavedSearch;
  patents: Array<PatentReference | Patent>;
  metadata: {
    queryString: string;
    providers: string[];
    filters: Record<string, unknown>;
    reviewCount: number;
    patentCount: number;
    uniqueAssignees: string[];
  };
}

interface PatentExportData {
  exportedAt: string;
  patents: PatentReference[];
  metadata: {
    totalCount: number;
    reviewStatusDistribution: Record<string, number>;
    legalStatusDistribution: Record<string, number>;
  };
}

/**
 * Export search results to CSV format
 * Includes query metadata and all result patents
 */
export function exportSearchToCSV(
  search: SavedSearch,
  patents: Array<PatentReference | Patent>
): string {
  const rows: string[] = [];

  // Header metadata
  rows.push('PATENT SEARCH EXPORT');
  rows.push('');
  rows.push(arrayToCSVRow(['Exported at', new Date().toISOString()]));
  rows.push(arrayToCSVRow(['Query', search.queryString]));
  rows.push(arrayToCSVRow(['Providers', search.providers.join(';')]));
  rows.push(arrayToCSVRow(['Result Count', search.resultCount]));
  rows.push(arrayToCSVRow(['Run Date', search.runAt]));
  rows.push(arrayToCSVRow(['Filters', JSON.stringify(search.filters)]));
  rows.push('');
  rows.push('RESULTS');
  rows.push('');

  // Column headers
  const headers = [
    'Patent Number',
    'Title',
    'Assignee',
    'Inventor(s)',
    'Filing Date',
    'Grant Date',
    'Provider',
    'Legal Status',
    'URL',
  ];
  rows.push(arrayToCSVRow(headers));

  // Patent rows
  patents.forEach((patent) => {
    const isPatentRef = 'patentData' in patent;
    const data = isPatentRef ? patent.patentData : patent;
    const patentNumber = isPatentRef ? patent.patentData.patentNumber : (patent as any).patentNumber;
    const inventors = isPatentRef ? patent.patentData.inventors : (patent as any).inventors;
    const provider = isPatentRef ? patent.patentData.provider : (patent as any).provider;
    const legalStatus = isPatentRef ? patent.patentData.legalStatus : (patent as any).legalStatus;
    const url = isPatentRef ? patent.patentData.url : (patent as any).url;

    rows.push(
      arrayToCSVRow([
        patentNumber || '',
        data.title,
        data.assignee,
        inventors?.join(';') || '',
        data.filingDate,
        data.grantDate,
        provider,
        legalStatus || 'N/A',
        url || '',
      ])
    );
  });

  return rows.join('\n');
}

/**
 * Export search results to JSON format
 * Includes full metadata and all indexed patent data
 */
export function exportSearchToJSON(
  search: SavedSearch,
  patents: Array<PatentReference | Patent>
): string {
  // Extract unique assignees for metadata
  const assignees = new Set<string>();
  patents.forEach((patent) => {
    const isPatentRef = 'patentData' in patent;
    const data = isPatentRef ? patent.patentData : patent;
    assignees.add(data.assignee);
  });

  const exportData: SearchExportData = {
    exportedAt: new Date().toISOString(),
    search,
    patents,
    metadata: {
      queryString: search.queryString,
      providers: search.providers,
      filters: search.filters,
      reviewCount: patents.filter((p) => 'status' in p).length,
      patentCount: patents.length,
      uniqueAssignees: Array.from(assignees).sort(),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export pinned patents to CSV format
 * Includes review status and notes
 */
export function exportPatentsToCSV(patents: PatentReference[]): string {
  const rows: string[] = [];

  // Header metadata
  rows.push('PINNED PATENTS EXPORT');
  rows.push('');
  rows.push(arrayToCSVRow(['Exported at', new Date().toISOString()]));
  rows.push(arrayToCSVRow(['Total Patents', patents.length]));
  rows.push('');
  rows.push('PATENTS');
  rows.push('');

  // Column headers
  const headers = [
    'Patent Number',
    'Title',
    'Assignee',
    'Inventor(s)',
    'Filing Date',
    'Grant Date',
    'Provider',
    'Legal Status',
    'Review Status',
    'Status Reason',
    'Notes',
    'URL',
  ];
  rows.push(arrayToCSVRow(headers));

  // Patent rows
  patents.forEach((patent) => {
    const { patentData, status, statusReason, notes } = patent;
    rows.push(
      arrayToCSVRow([
        patentData.patentNumber || '',
        patentData.title,
        patentData.assignee,
        patentData.inventors?.join(';') || '',
        patentData.filingDate,
        patentData.grantDate,
        patentData.provider,
        patentData.legalStatus || 'N/A',
        status,
        statusReason || '',
        notes || '',
        patentData.url || '',
      ])
    );
  });

  return rows.join('\n');
}

/**
 * Export pinned patents to JSON format
 * Includes full metadata with review status distribution
 */
export function exportPatentsToJSON(patents: PatentReference[]): string {
  // Calculate distributions
  const reviewStatusDist: Record<string, number> = {};
  const legalStatusDist: Record<string, number> = {};

  patents.forEach((patent) => {
    reviewStatusDist[patent.status] = (reviewStatusDist[patent.status] || 0) + 1;
    const status = patent.patentData.legalStatus || 'UNKNOWN';
    legalStatusDist[status] = (legalStatusDist[status] || 0) + 1;
  });

  const exportData: PatentExportData = {
    exportedAt: new Date().toISOString(),
    patents,
    metadata: {
      totalCount: patents.length,
      reviewStatusDistribution: reviewStatusDist,
      legalStatusDistribution: legalStatusDist,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Trigger file download with given content and filename
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
