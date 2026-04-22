import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { PatentTable } from '@/components/PatentTable';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { StatsBar } from '@/components/StatsBar';
import { TopSearchesChart } from '@/components/TopSearchesChart';
import { GuidedWorkflowSection } from '@/components/GuidedWorkflowSection';
import { SaveSearchModal } from '@/components/projects/SaveSearchModal';
import {
  searchAllProviders,
  ParsedPatentQuery,
  searchPatents,
  Patent,
  PatentSearchFacets,
  PatentSearchFilters,
} from '@/lib/patentApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const EMPTY_FACETS: PatentSearchFacets = {
  topAssignees: [],
  filingYearHistogram: [],
  providerSplit: [],
};

const Index = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [searchTime, setSearchTime] = useState<number | undefined>();
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentParsedQuery, setCurrentParsedQuery] = useState<ParsedPatentQuery | undefined>();
  const [activeFilters, setActiveFilters] = useState<PatentSearchFilters>({});
  const [facets, setFacets] = useState<PatentSearchFacets>(EMPTY_FACETS);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSearch = useCallback(async (query: string, filters: PatentSearchFilters, parsedQuery?: ParsedPatentQuery) => {
    setIsLoading(true);
    setError(undefined);
    setCurrentQuery(query);
    setCurrentParsedQuery(parsedQuery);
    setActiveFilters(filters);
    const startTime = performance.now();

    try {
      const result =
        filters.providers && filters.providers.length === 1
          ? await searchPatents(query, filters.providers[0], 1, 25, filters)
          : await searchAllProviders(query, filters);
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);

      if (result.error) {
        setError(result.error);
        setPatents([]);
        setTotal(0);
        setFacets(EMPTY_FACETS);
      } else {
        setPatents(result.patents);
        setTotal(result.total);
        setFacets(result.facets);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setPatents([]);
      setTotal(0);
      setFacets(EMPTY_FACETS);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleClearFilter = async (filterKey: keyof PatentSearchFilters) => {
    const nextFilters: PatentSearchFilters = {
      ...activeFilters,
      [filterKey]: undefined,
    };
    setActiveFilters(nextFilters);

    if (currentQuery) {
      await handleSearch(currentQuery, nextFilters, currentParsedQuery);
    }
  };

  const handleClearAllFilters = async () => {
    setActiveFilters({});

    if (currentQuery && hasSearched) {
      await handleSearch(currentQuery, {}, currentParsedQuery);
    }
  };

  const handleBackToSearch = () => {
    setHasSearched(false);
    setPatents([]);
    setTotal(0);
    setError(undefined);
    setCurrentQuery('');
    setCurrentParsedQuery(undefined);
    setSearchTime(undefined);
    setActiveFilters({});
    setFacets(EMPTY_FACETS);
  };

  const activeFilterChips = [
    activeFilters.filingDateFrom
      ? { key: 'filingDateFrom' as const, label: `Filing from: ${activeFilters.filingDateFrom}` }
      : null,
    activeFilters.filingDateTo
      ? { key: 'filingDateTo' as const, label: `Filing to: ${activeFilters.filingDateTo}` }
      : null,
    activeFilters.grantDateFrom
      ? { key: 'grantDateFrom' as const, label: `Grant from: ${activeFilters.grantDateFrom}` }
      : null,
    activeFilters.grantDateTo
      ? { key: 'grantDateTo' as const, label: `Grant to: ${activeFilters.grantDateTo}` }
      : null,
    activeFilters.assigneeContains
      ? { key: 'assigneeContains' as const, label: `Assignee: ${activeFilters.assigneeContains}` }
      : null,
    activeFilters.inventorContains
      ? { key: 'inventorContains' as const, label: `Inventor: ${activeFilters.inventorContains}` }
      : null,
    activeFilters.providers && activeFilters.providers.length > 0
      ? { key: 'providers' as const, label: `Providers: ${activeFilters.providers.join(', ')}` }
      : null,
    activeFilters.legalStatuses && activeFilters.legalStatuses.length > 0
      ? { key: 'legalStatuses' as const, label: `Legal: ${activeFilters.legalStatuses.join(', ')}` }
      : null,
  ].filter((value): value is { key: keyof PatentSearchFilters; label: string } => value !== null);

  const providerLabel =
    activeFilters.providers && activeFilters.providers.length > 0
      ? activeFilters.providers.join(', ')
      : 'All providers';

  const providersForSave =
    activeFilters.providers && activeFilters.providers.length > 0
      ? activeFilters.providers
      : facets.providerSplit.map((entry) => entry.provider);

  const handleGuidedSearch = (query: string) => {
    void handleSearch(query, activeFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Patent Research Made{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Simple
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Search millions of patents from multiple databases worldwide. Find innovations, prior art, and intellectual property insights instantly.
          </p>
          
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            filters={activeFilters}
            onFiltersChange={setActiveFilters}
            onClearFilters={handleClearAllFilters}
          />
          
          {/* Back to Search Button - shown after search */}
          {hasSearched && !isLoading && (
            <div className="mt-6 animate-fade-in text-left">
              <Button 
                variant="outline" 
                onClick={handleBackToSearch}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search Options
              </Button>
            </div>
          )}
        </div>

        {/* Charts Section - shown when no search has been performed */}
        {!hasSearched && !isLoading && (
          <div className="mb-12 space-y-16">
            <TopSearchesChart />
            <GuidedWorkflowSection onSearch={handleGuidedSearch} />
          </div>
        )}

        {/* Stats Bar */}
        {hasSearched && !isLoading && !error && patents.length > 0 && (
          <div>
            <div className="mb-4">
              <StatsBar
                total={total}
                searchTime={searchTime}
                query={currentQuery}
                providerLabel={providerLabel}
                facets={facets}
              />
              <Button
                onClick={() => setShowSaveModal(true)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save to Project
              </Button>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="mt-8">
          {hasSearched && !isLoading && !error && patents.length > 0 && activeFilterChips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => handleClearFilter(chip.key)}
                    className="rounded-full hover:bg-muted/70"
                    aria-label={`Clear filter ${chip.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={handleClearAllFilters}>
                Clear all
              </Button>
            </div>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : patents.length > 0 ? (
            <PatentTable patents={patents} total={total} parsedQuery={currentParsedQuery} />
          ) : (
            <EmptyState hasSearched={hasSearched} error={error} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Search across multiple patent databases including{' '}
            <a 
              href="https://patentsview.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              USPTO
            </a>
            ,{' '}
            <a 
              href="https://www.epo.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              EPO
            </a>
            ,{' '}
            <a 
              href="https://www.wipo.int" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              WIPO
            </a>
            , and Google Patents. For research and educational purposes.
          </p>
        </div>
      </footer>

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentSearch={{
          queryString: currentQuery,
          parsedQuery: currentParsedQuery,
          providers: providersForSave,
          filters: activeFilters,
          results: patents,
          stats: {
            total,
            resultCount: patents.length,
            facets,
          },
        }}
      />
    </div>
  );
};

export default Index;
