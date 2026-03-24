import { Database, Clock, Globe, Building2, BarChart3 } from 'lucide-react';
import { PatentSearchFacets } from '@/lib/patentApi';

interface StatsBarProps {
  total: number;
  searchTime?: number;
  query: string;
  providerLabel: string;
  facets: PatentSearchFacets;
}

export function StatsBar({ total, searchTime, query, providerLabel, facets }: StatsBarProps) {
  if (!query) return null;

  const topAssignee = facets.topAssignees[0];
  const filingWindow =
    facets.filingYearHistogram.length > 0
      ? `${facets.filingYearHistogram[0].year}-${facets.filingYearHistogram[facets.filingYearHistogram.length - 1].year}`
      : 'N/A';

  const providerSplitSummary =
    facets.providerSplit.length > 0
      ? facets.providerSplit.map((entry) => `${entry.provider} (${entry.count})`).join(', ')
      : 'N/A';

  return (
    <div className="flex flex-wrap items-center gap-6 py-4 px-6 bg-secondary/50 rounded-xl mb-8 animate-fade-in">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-sm">
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          <span className="text-muted-foreground"> patents found</span>
        </span>
      </div>
      {searchTime && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <span className="font-medium text-foreground">{searchTime.toFixed(2)}s</span>
            <span className="text-muted-foreground"> search time</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Source: <span className="font-medium text-foreground">{providerLabel}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Top assignee:{' '}
          <span className="font-medium text-foreground">
            {topAssignee ? `${topAssignee.name} (${topAssignee.count})` : 'N/A'}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Filing years: <span className="font-medium text-foreground">{filingWindow}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Provider split: <span className="font-medium text-foreground">{providerSplitSummary}</span>
        </span>
      </div>
    </div>
  );
}
