import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PatentProvider, PatentSearchFilters, PROVIDERS } from '@/lib/patentApi';

interface SearchBarProps {
  onSearch: (query: string, filters: PatentSearchFilters) => void;
  isLoading: boolean;
  filters: PatentSearchFilters;
  onFiltersChange: (filters: PatentSearchFilters) => void;
  onClearFilters: () => void;
}

function normalizeFilters(filters: PatentSearchFilters): PatentSearchFilters {
  const trimmedAssignee = filters.assigneeContains?.trim();
  const trimmedInventor = filters.inventorContains?.trim();

  return {
    filingDateFrom: filters.filingDateFrom || undefined,
    filingDateTo: filters.filingDateTo || undefined,
    grantDateFrom: filters.grantDateFrom || undefined,
    grantDateTo: filters.grantDateTo || undefined,
    assigneeContains: trimmedAssignee || undefined,
    inventorContains: trimmedInventor || undefined,
    providers: filters.providers && filters.providers.length > 0 ? filters.providers : undefined,
  };
}

export function SearchBar({ onSearch, isLoading, filters, onFiltersChange, onClearFilters }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputId = 'patent-query-input';
  const hintId = 'patent-query-hint';

  const updateFilter = <K extends keyof PatentSearchFilters>(key: K, value: PatentSearchFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleProvider = (provider: PatentProvider, checked: boolean) => {
    const currentProviders = filters.providers ?? [];
    const nextProviders = checked
      ? [...new Set([...currentProviders, provider])]
      : currentProviders.filter((entry) => entry !== provider);

    updateFilter('providers', nextProviders.length ? nextProviders : undefined);
  };

  const hasActiveFilters = Boolean(
    filters.filingDateFrom ||
      filters.filingDateTo ||
      filters.grantDateFrom ||
      filters.grantDateTo ||
      filters.assigneeContains?.trim() ||
      filters.inventorContains?.trim() ||
      (filters.providers && filters.providers.length > 0)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), normalizeFilters(filters));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <label htmlFor={inputId} className="sr-only">
        Patent search query
      </label>
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id={inputId}
            type="text"
            placeholder="Enter a topic, keyword, or technology..."
            aria-describedby={hintId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-14 text-lg bg-card border-border shadow-card rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="h-14 px-8 text-lg font-medium rounded-xl gradient-hero shadow-elevated hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching
            </>
          ) : (
            'Search Patents'
          )}
        </Button>
      </div>
      <p id={hintId} className="sr-only">
        Enter keywords like neural network, battery chemistry, or robotics and submit to search patents.
      </p>

      <div className="mt-6 p-4 bg-card border border-border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Advanced Filters</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
          >
            Clear all
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="filing-date-from">Filing Date From</Label>
            <Input
              id="filing-date-from"
              type="date"
              value={filters.filingDateFrom ?? ''}
              onChange={(e) => updateFilter('filingDateFrom', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filing-date-to">Filing Date To</Label>
            <Input
              id="filing-date-to"
              type="date"
              value={filters.filingDateTo ?? ''}
              onChange={(e) => updateFilter('filingDateTo', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grant-date-from">Grant Date From</Label>
            <Input
              id="grant-date-from"
              type="date"
              value={filters.grantDateFrom ?? ''}
              onChange={(e) => updateFilter('grantDateFrom', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grant-date-to">Grant Date To</Label>
            <Input
              id="grant-date-to"
              type="date"
              value={filters.grantDateTo ?? ''}
              onChange={(e) => updateFilter('grantDateTo', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignee-contains">Assignee (contains)</Label>
            <Input
              id="assignee-contains"
              type="text"
              value={filters.assigneeContains ?? ''}
              placeholder="e.g. Toyota"
              onChange={(e) => updateFilter('assigneeContains', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inventor-contains">Inventor (contains)</Label>
            <Input
              id="inventor-contains"
              type="text"
              value={filters.inventorContains ?? ''}
              placeholder="e.g. Chen"
              onChange={(e) => updateFilter('inventorContains', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Provider/Jurisdiction</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PROVIDERS.map((provider) => {
              const checked = Boolean(filters.providers?.includes(provider.id));

              return (
                <label
                  key={provider.id}
                  className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleProvider(provider.id, value === true)}
                    aria-label={`Filter by ${provider.name}`}
                  />
                  <span>{provider.name}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Leave unchecked to search across all providers.</p>
        </div>
      </div>
    </form>
  );
}
