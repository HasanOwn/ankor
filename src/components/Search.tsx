import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
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
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
    >
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Korean, Uzbek, or Romanization..."
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Results */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-150px)]">
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No results found for "{searchQuery}"
            </p>
          )}

          {!searchQuery && (
            <p className="text-center text-muted-foreground py-12">
              Start typing to search across all your vocabulary sets
            </p>
          )}

          {searchResults.map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-2xl font-bold">{result.korean}</span>
                      <span className="text-sm text-muted-foreground">
                        {result.romanization}
                      </span>
                    </div>
                    <p className="text-lg mb-2">{result.uzbek}</p>
                    {result.example && (
                      <p className="text-sm text-muted-foreground italic">
                        "{result.example}"
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {result.setName}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Search;
