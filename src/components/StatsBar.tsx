import { Database, Clock, Globe } from 'lucide-react';
import { PatentProvider } from '@/lib/patentApi';

interface StatsBarProps {
  total: number;
  searchTime?: number;
  query: string;
  provider: PatentProvider;
}

export function StatsBar({ total, searchTime, query, provider }: StatsBarProps) {
  if (!query) return null;

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
          Source: <span className="font-medium text-foreground">{provider}</span>
        </span>
      </div>
    </div>
  );
}
