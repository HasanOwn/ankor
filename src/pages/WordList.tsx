import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import WordTable from '@/components/WordTable';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Word, SortOption } from '@/types/word';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const WordList = () => {
  const navigate = useNavigate();
  const [words, setWords] = useLocalStorage<Word[]>('korean-words', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date');

  const filteredAndSortedWords = useMemo(() => {
    let filtered = words.filter(
      word =>
        word.korean.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOption === 'alphabetical') {
      filtered.sort((a, b) => a.korean.localeCompare(b.korean));
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }, [words, searchQuery, sortOption]);

  const handleEdit = (word: Word) => {
    navigate('/add', { state: { word } });
  };

  const handleDelete = (id: number) => {
    setWords(words.filter(w => w.id !== id));
    toast.success('Word deleted successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      
      <main className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Word List</h1>
            <p className="text-muted-foreground">
              {words.length} word{words.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by Korean or meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full md:w-[200px] bg-card border-border">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <WordTable
              words={filteredAndSortedWords}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default WordList;
