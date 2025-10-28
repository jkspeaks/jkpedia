import { useState } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ContentDisplay } from '@/components/ContentDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  found: boolean;
  score?: number;
  title?: string;
  content?: string;
  isOriginal?: boolean;
  attribution?: string;
  sources?: Array<{ url: string; title: string }>;
  message?: string;
  error?: string;
}

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('verify-wikipedia', {
        body: { searchTerm: searchTerm.trim() }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: "Credits Depleted",
            description: "AI verification credits have been used up. Please add more credits to continue.",
            variant: "destructive",
          });
        }
        throw new Error(data.error);
      }

      setResults(data);
      
      if (!data.found) {
        toast({
          title: "No Results",
          description: data.message || `No Wikipedia article found for "${searchTerm}"`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch information. Please try again.');
      toast({
        title: "Search Failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-smooth">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main>
        {!results && !isSearching && !error && (
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            isLoading={isSearching}
            centered
          />
        )}

        {(results || isSearching || error) && (
          <>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              isLoading={isSearching}
            />

            {isSearching && <LoadingSpinner />}

            {error && <ErrorMessage message={error} />}

            {results && results.found && results.score && results.title && results.content && (
              <div className="py-8">
                <div className="max-w-4xl mx-auto px-6">
                  <ScoreBadge score={results.score} />
                </div>
                <ContentDisplay
                  title={results.title}
                  content={results.content}
                  attribution={results.attribution || ''}
                  sources={results.sources}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
