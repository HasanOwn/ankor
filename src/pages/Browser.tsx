import { useMemo, useState, useDeferredValue, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search as SearchIcon, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet, Word, CardState } from '@/types/word';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WordForm from '@/components/WordForm';
import { toast } from 'sonner';

type StateFilter = 'all' | CardState | 'due';

interface Row { word: Word; setId: string; setName: string; }

const Browser = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [q, setQ] = useState('');
  const [deckFilter, setDeckFilter] = useLocalStorage<string>('browser-deck-filter', 'all');
  const [limit, setLimit] = useState(40);
  const dq = useDeferredValue(q);
  const [stateFilter, setStateFilter] = useLocalStorage<StateFilter>('browser-state-filter', 'all');
  const [editing, setEditing] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    const now = Date.now();
    const ql = dq.trim().toLowerCase();
    const out: Row[] = [];
    for (const s of vocabSets) {
      if (deckFilter !== 'all' && s.id !== deckFilter) continue;
      for (const w of s.words || []) {
        const st = w.state ?? 'new';
        if (stateFilter === 'due' && (w.due ?? 0) > now) continue;
        if (stateFilter !== 'all' && stateFilter !== 'due' && st !== stateFilter) continue;
        if (ql) {
          const hay = `${w.korean} ${w.uzbek} ${w.romanization || ''} ${w.example || ''} ${w.category || ''}`.toLowerCase();
          if (!hay.includes(ql)) continue;
        }
        out.push({ word: w, setId: s.id, setName: s.name });
      }
    }
    out.sort((a, b) => (b.word.createdAt || 0) - (a.word.createdAt || 0));
    return out;
  }, [vocabSets, dq, deckFilter, stateFilter]);

  useEffect(() => { setLimit(40); }, [dq, deckFilter, stateFilter]);
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY > document.body.offsetHeight - 800) setLimit(l => l + 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSave = (data: Omit<Word, 'id' | 'createdAt'>) => {
    if (!editing) return;
    const { word, setId } = editing;
    const updated: Word = { ...data, id: word.id, createdAt: word.createdAt };
    setVocabSets(vocabSets.map(s => s.id === setId
      ? { ...s, words: s.words.map(w => w.id === word.id ? updated : w) }
      : s));
    toast.success('Card updated');
    setEditing(null);
  };

  const stateBadge = (w: Word) => {
    const s = w.state ?? 'new';
    const cls = s === 'new' ? 'bg-badge-new text-badge-new-foreground'
      : s === 'learning' ? 'bg-badge-learning text-badge-learning-foreground'
      : 'bg-badge-review text-badge-review-foreground';
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${cls}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-28">

      <motion.header initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Browser</h1>
        </div>
        <div className="container max-w-2xl mx-auto px-4 pb-3 space-y-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all cards…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 border-0 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            {q && (
              <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setQ('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-4">
            <Select value={deckFilter} onValueChange={setDeckFilter}>
              <SelectTrigger className="flex-1 bg-muted/50 border-0 rounded-xl h-11 focus:ring-1 focus:ring-primary/30">
                <SelectValue placeholder="All decks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All decks</SelectItem>
                {[...vocabSets].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as StateFilter)}>
              <SelectTrigger className="flex-1 bg-muted/50 border-0 rounded-xl h-11 focus:ring-1 focus:ring-primary/30">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="due">Due now</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl mx-auto px-4 pt-2">
        <div className="text-xs text-muted-foreground mb-3">{rows.length} card{rows.length === 1 ? '' : 's'}</div>
        {rows.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl card-elev p-8 text-center text-muted-foreground text-sm">
            No cards match your filters.
          </motion.div>
        ) : (
          <ul className="space-y-2">
            {rows.slice(0, limit).map((r, i) => (
              <motion.li key={`${r.setId}-${r.word.id}`}
                initial={i < 14 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + Math.min(i, 14) * 0.03, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                <div className="w-full bg-card rounded-2xl card-elev px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 items-baseline gap-x-4">
                      <span className="text-base font-semibold text-foreground break-words leading-snug">{r.word.korean}</span>
                      <span className="text-sm text-foreground/80 break-words leading-snug text-right">{r.word.uzbek}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 min-w-0">
                      {r.word.romanization && <span className="text-xs text-muted-foreground truncate">{r.word.romanization}</span>}
                      <span className="text-[10px] text-muted-foreground truncate ml-auto">{r.setName}</span>
                      {stateBadge(r.word)}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full text-muted-foreground" aria-label={`Edit ${r.word.korean}`} title="Edit card" onClick={() => setEditing(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent
          className="bg-card max-w-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit card {editing && <span className="text-xs text-muted-foreground font-normal">· {editing.setName}</span>}</DialogTitle>
          </DialogHeader>
          {editing && (
            <WordForm word={editing.word} onSave={handleSave} onCancel={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Browser;
