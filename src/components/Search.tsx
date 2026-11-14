import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VocabSet, Word } from '@/types/word';
import { Card } from '@/components/ui/card';

interface SearchProps {
  vocabSets: VocabSet[];
  onClose: () => void;
}

interface SearchResult extends Word {
  setName: string;
}

const Search = ({ vocabSets, onClose }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    vocabSets.forEach(set => {
      set.words?.forEach(word => {
        const matchesKorean = word.korean?.toLowerCase().includes(query);
        const matchesUzbek = word.uzbek?.toLowerCase().includes(query);
        const matchesRoman = word.romanization?.toLowerCase().includes(query);

        if (matchesKorean || matchesUzbek || matchesRoman) {
          results.push({ ...word, setName: set.name });
        }
      });
    });

    return results;
  }, [searchQuery, vocabSets]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Search cards"
      aria-modal="true"
      className="fixed inset-0 h-dvh bg-background z-50 flex flex-col"
    >
      <header className="relative z-10 shrink-0">
        <div aria-hidden="true" className="search-top-fade pointer-events-none absolute inset-x-0 top-0 -bottom-6" />
        <div className="relative container max-w-2xl mx-auto px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Search</h2>
            <Button variant="ghost" size="icon" aria-label="Close search" onClick={onClose} className="rounded-full text-muted-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>
        <div className="relative">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              aria-label="Search cards"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards…"
              className="pl-11 pr-11 h-12 text-base bg-muted/70 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
          {searchQuery.trim() && <div className="mt-3 text-xs font-medium text-muted-foreground" role="status">{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</div>}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" aria-label="Search results">
        <div className="container max-w-2xl mx-auto px-4 pt-5 pb-32 space-y-3">
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-12 break-words">
              No results found for "{searchQuery}"
            </p>
          )}

          {!searchQuery && (
            <div className="flex justify-center py-16 text-muted-foreground/50" aria-hidden="true"><BookOpen className="h-9 w-9" strokeWidth={1.25} /></div>
          )}

          {searchResults.map((result) => (
            <Card key={`${result.setName}-${result.id}`} className="p-4 rounded-xl border-0 shadow-none bg-card">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{result.setName}</span>
                    </div>
                    <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1.5">
                      <span className="text-xl font-semibold break-words max-w-full">{result.korean}</span>
                      <span className="text-sm text-muted-foreground break-words max-w-full">
                        {result.romanization}
                      </span>
                    </div>
                    <p className="text-base break-words">{result.uzbek}</p>
                    {result.example && (
                      <p className="text-sm text-muted-foreground italic mt-2 break-words">
                        "{result.example}"
                      </p>
                    )}
                  </div>
              </Card>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="search-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 h-24" />
    </motion.div>
  );
};

export default Search;
