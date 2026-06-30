import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, ArrowLeft, Sparkles, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import WordForm from '@/components/WordForm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet, Word, SortOption } from '@/types/word';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WordList = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categorizing, setCategorizing] = useState(false);

  const currentSet = vocabSets.find(set => set.id === setId);

  if (!currentSet) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12 text-center">
          <p className="text-muted-foreground">Set not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </main>
      </div>
    );
  }

  const filteredWords = useMemo(() => {
    let words = [...currentSet.words];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      words = words.filter(word =>
        word.korean.toLowerCase().includes(q) ||
        word.uzbek.toLowerCase().includes(q) ||
        (word.romanization || '').toLowerCase().includes(q)
      );
    }
    if (sortOption === 'alphabetical') {
      words.sort((a, b) => a.korean.localeCompare(b.korean));
    } else {
      words.sort((a, b) => b.createdAt - a.createdAt);
    }
    return words;
  }, [currentSet.words, searchQuery, sortOption]);

  const hasCategories = currentSet.words.some(w => w.category);

  const groupedWords = useMemo(() => {
    if (!hasCategories) return null;
    const groups = new Map<string, Word[]>();
    for (const w of filteredWords) {
      const key = w.category || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredWords, hasCategories]);

  const persistSet = (updated: VocabSet) => {
    setVocabSets(vocabSets.map(s => s.id === setId ? updated : s));
  };

  const handleAddWord = (wordData: Omit<Word, 'id' | 'createdAt'>) => {
    const newWord: Word = { ...wordData, id: Date.now(), set: currentSet.name, createdAt: Date.now() };
    persistSet({ ...currentSet, words: [...currentSet.words, newWord] });
    setShowForm(false);
    toast.success('Word added');
  };

  const handleUpdateWord = (wordData: Omit<Word, 'id' | 'createdAt'>) => {
    if (!editingWord) return;
    const updatedWord: Word = { ...wordData, id: editingWord.id, createdAt: editingWord.createdAt };
    persistSet({ ...currentSet, words: currentSet.words.map(w => w.id === editingWord.id ? updatedWord : w) });
    setEditingWord(null);
    toast.success('Word updated');
  };

  const handleDeleteWord = (wordId: number) => {
    persistSet({ ...currentSet, words: currentSet.words.filter(w => w.id !== wordId) });
    toast.success('Word deleted');
  };

  const handleCategorize = async () => {
    if (currentSet.words.length === 0) {
      toast.info('Add some words first');
      return;
    }
    setCategorizing(true);
    try {
      const payload = currentSet.words.map(w => ({ id: w.id, term: w.korean, translation: w.uzbek }));
      const { data, error } = await supabase.functions.invoke('categorize-words', {
        body: { words: payload },
        headers: { 'x-app-token': import.meta.env.VITE_CATEGORIZE_CLIENT_TOKEN ?? '' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const assignments: { id: number; category: string }[] = data?.assignments || [];
      const map = new Map(assignments.map(a => [a.id, a.category]));
      const updated: VocabSet = {
        ...currentSet,
        words: currentSet.words.map(w => ({ ...w, category: map.get(w.id) || w.category || 'Uncategorized' })),
      };
      persistSet(updated);
      toast.success(`Categorized ${assignments.length} words`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to categorize');
    } finally {
      setCategorizing(false);
    }
  };

  const handleClearCategories = () => {
    persistSet({ ...currentSet, words: currentSet.words.map(w => ({ ...w, category: undefined })) });
    toast.success('Categories cleared');
  };

  const renderWordCard = (word: Word) => (
    <div key={word.id}>
      {editingWord?.id === word.id ? (
        <div className="p-6 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Edit Word</h2>
          <WordForm word={editingWord} onSave={handleUpdateWord} onCancel={() => setEditingWord(null)} />
        </div>
      ) : (
        <div className="p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="text-2xl font-semibold">{word.korean}</h3>
                {word.romanization && (
                  <span className="text-sm text-muted-foreground">{word.romanization}</span>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{word.uzbek}</p>
              {word.example && <p className="text-sm text-muted-foreground italic mt-2">{word.example}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditingWord(word)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-destructive/20 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this word?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This will permanently delete "{word.korean}" from this set.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteWord(word.id)} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{currentSet.name}</h1>
                <p className="text-muted-foreground">{currentSet.words.length} words</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="btn-glow">
              <Plus className="mr-2 h-4 w-4" />
              Add Word
            </Button>
          </div>

          {showForm && !editingWord && (
            <div className="p-6 bg-card border border-border rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Add New Word</h2>
              <WordForm onSave={handleAddWord} onCancel={() => setShowForm(false)} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Categorize */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCategorize} disabled={categorizing || currentSet.words.length === 0} variant="outline" className="btn-glow">
              {categorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {hasCategories ? 'Re-categorize with AI' : 'Categorize with AI'}
            </Button>
            {hasCategories && (
              <Button onClick={handleClearCategories} variant="ghost" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                Clear categories
              </Button>
            )}
          </div>

          {groupedWords ? (
            <div className="space-y-6">
              {groupedWords.map(([category, words]) => (
                <section key={category} className="space-y-3">
                  <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                    {category} <span className="text-muted-foreground font-normal text-sm">({words.length})</span>
                  </h2>
                  <div className="space-y-3">{words.map(renderWordCard)}</div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-3">{filteredWords.map(renderWordCard)}</div>
          )}

          {filteredWords.length === 0 && (
            <div className="text-center text-muted-foreground p-12 bg-card border border-border rounded-xl">
              {searchQuery ? 'No words found matching your search' : 'No words in this set yet'}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default WordList;
