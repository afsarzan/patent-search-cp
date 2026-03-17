import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputId = 'patent-query-input';
  const hintId = 'patent-query-hint';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
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
    </form>
  );
}
