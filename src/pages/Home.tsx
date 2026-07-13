import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  RefreshCw, ChevronDown, Eye, Pencil,
  Search as SearchIcon, Trash2, Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet } from '@/types/word';
import { bucketCounts } from '@/lib/srs';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Search from '@/components/Search';
import { CloudShareDialog } from '@/components/CloudShareDialog';

interface StudySession { date: string; cards: number; minutes: number; }

const Badge = ({ tone, children }: { tone: 'new' | 'learning' | 'review'; children: React.ReactNode }) => {
  const tones = {
    new: 'bg-badge-new text-badge-new-foreground',
    learning: 'bg-badge-learning text-badge-learning-foreground',
    review: 'bg-badge-review text-badge-review-foreground',
  } as const;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

const DeckCard = ({
  set, onStudy, onEdit, onDelete,
}: {
  set: VocabSet;
  onStudy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const counts = bucketCounts(set.words || []);
  const total = set.words?.length || 0;

  return (
    <motion.div layout className="bg-card rounded-2xl card-elev overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground truncate">{set.name}</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge tone="new">{counts.new} New</Badge>
            <Badge tone="learning">{counts.learning} Learning</Badge>
            <Badge tone="review">{counts.review} Review</Badge>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="text-muted-foreground ml-2">
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5 text-sm">
              <div className="flex items-baseline">
                <span className="text-muted-foreground flex-1">• Due today</span>
                <span className="font-semibold text-foreground w-12 text-right">{counts.due}</span>
                <span className="text-muted-foreground w-16 text-right">cards</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-muted-foreground flex-1">• Total cards</span>
                <span className="font-semibold text-foreground w-12 text-right">{total}</span>
                <span className="text-muted-foreground w-16 text-right">cards</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-muted-foreground flex-1">• Reviewed</span>
                <span className="font-semibold text-foreground w-12 text-right">{counts.review}</span>
                <span className="text-muted-foreground w-16 text-right">cards</span>
              </div>
            </div>
            <div className="flex border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex-1 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {set.name}?</AlertDialogTitle>
                    <AlertDialogDescription>This permanently removes the deck and its cards.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button onClick={onEdit} className="flex-1 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border-l border-border">
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button onClick={onStudy} className="flex-1 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border-l border-border">
                <Eye className="h-4 w-4" /> Study
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [sessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [showSearch, setShowSearch] = useState(false);
  const [categorizingId, setCategorizingId] = useState<string | null>(null);

  const handleCategorize = async (set: VocabSet) => {
    if (!set.words?.length) { toast.info('Add words first'); return; }
    setCategorizingId(set.id);
    try {
      const payload = set.words.map(w => ({ id: w.id, term: w.korean, translation: w.uzbek }));
      const { data, error } = await supabase.functions.invoke('categorize-words', {
        body: { words: payload },
        headers: { 'x-app-token': 'su0o8wLH0LSIIkEd5WFPvd4D4GlEE5fX' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const assignments: { id: number; category: string }[] = data?.assignments || [];
      const map = new Map(assignments.map(a => [a.id, a.category]));
      const updated: VocabSet = {
        ...set,
        words: set.words.map((w: Word) => ({ ...w, category: map.get(w.id) || w.category || 'Uncategorized' })),
      };
      setVocabSets(vocabSets.map(s => s.id === set.id ? updated : s));
      toast.success(`Grouped ${assignments.length} words`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to categorize');
    } finally {
      setCategorizingId(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todaySession = sessions.find(s => s.date === today);

  const totals = vocabSets.reduce((acc, s) => {
    const c = bucketCounts(s.words || []);
    acc.due += c.due;
    return acc;
  }, { due: 0 });

  const handleImportSets = (newSets: VocabSet[]) => {
    const existing = new Set(vocabSets.map(s => s.name.toLowerCase()));
    const toAdd = newSets.filter(s => !existing.has(s.name.toLowerCase()));
    if (toAdd.length) setVocabSets([...vocabSets, ...toAdd]);
    const skipped = newSets.length - toAdd.length;
    if (skipped > 0) toast.info(`Skipped ${skipped} duplicate set(s)`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">AnKor</h1>
          <div className="flex items-center gap-1">
            <CloudShareDialog
              vocabSets={vocabSets}
              onImport={handleImportSets}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Cloud Share">
                  <Cloud className="h-5 w-5 text-muted-foreground" />
                </Button>
              }
            />
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {showSearch && <Search vocabSets={vocabSets} onClose={() => setShowSearch(false)} />}

      <main className="container max-w-2xl mx-auto px-4 pt-2 space-y-6">
        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-due text-due-foreground rounded-2xl p-4 card-elev">
              <div className="text-sm font-medium opacity-90">Due</div>
              <div className="text-4xl font-bold mt-1">{totals.due}</div>
              <div className="text-xs opacity-90 mt-1">cards today</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-studied text-studied-foreground rounded-2xl p-4 card-elev">
              <div className="text-sm font-medium opacity-90">Studied</div>
              <div className="text-4xl font-bold mt-1">{todaySession?.cards ?? 0}</div>
              <div className="text-xs opacity-90 mt-1">
                cards in {todaySession?.minutes ?? 0} minutes today
              </div>
            </motion.div>
          </div>
        </section>

        {/* Decks */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your decks</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {vocabSets.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl card-elev p-8 text-center text-muted-foreground">
              <p className="text-sm">No decks yet. Tap the <span className="text-primary font-semibold">+</span> to create one.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {vocabSets.map((set, i) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <DeckCard
                    set={set}
                    onStudy={() => navigate(`/study/${set.id}`)}
                    onEdit={() => navigate(`/words/${set.id}`)}
                    onDelete={() => setVocabSets(vocabSets.filter(s => s.id !== set.id))}
                    onCategorize={() => handleCategorize(set)}
                    categorizing={categorizingId === set.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

    </div>
  );
};

export default Home;
