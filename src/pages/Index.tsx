import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { PatentTable } from '@/components/PatentTable';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { StatsBar } from '@/components/StatsBar';
import { TopSearchesChart } from '@/components/TopSearchesChart';
import { GuidedWorkflowSection } from '@/components/GuidedWorkflowSection';
import { ProviderSelector } from '@/components/ProviderSelector';
import { searchPatents, Patent, PatentProvider } from '@/lib/patentApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [searchTime, setSearchTime] = useState<number | undefined>();
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<PatentProvider>('USPTO');

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(undefined);
    setCurrentQuery(query);
    const startTime = performance.now();

    try {
      const result = await searchPatents(query, selectedProvider);
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);

      if (result.error) {
        setError(result.error);
        setPatents([]);
        setTotal(0);
      } else {
        setPatents(result.patents);
        setTotal(result.total);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setPatents([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, [selectedProvider]);

  const handleBackToSearch = () => {
    setHasSearched(false);
    setPatents([]);
    setTotal(0);
    setError(undefined);
    setCurrentQuery('');
    setSearchTime(undefined);
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
          
          {/* Provider Selector */}
          <ProviderSelector 
            selectedProvider={selectedProvider} 
            onProviderChange={setSelectedProvider}
          />
          
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          
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
            <GuidedWorkflowSection onSearch={handleSearch} />
          </div>
        )}

        {/* Stats Bar */}
        {hasSearched && !isLoading && !error && patents.length > 0 && (
          <StatsBar total={total} searchTime={searchTime} query={currentQuery} provider={selectedProvider} />
        )}

        {/* Results Section */}
        <div className="mt-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : patents.length > 0 ? (
            <PatentTable patents={patents} total={total} />
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
    </div>
  );
};

export default Index;
