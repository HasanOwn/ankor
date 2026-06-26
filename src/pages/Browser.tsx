import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet, Word, CardState } from '@/types/word';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WordForm from '@/components/WordForm';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

type StateFilter = 'all' | CardState | 'due';

interface Row { word: Word; setId: string; setName: string; }

const Browser = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [q, setQ] = useState('');
  const [deckFilter, setDeckFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [editing, setEditing] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    const now = Date.now();
    const ql = q.trim().toLowerCase();
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
  }, [vocabSets, q, deckFilter, stateFilter]);

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

      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
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
              autoFocus
              placeholder="Search all cards…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-10 pr-10 bg-card border-border rounded-xl"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={deckFilter} onValueChange={setDeckFilter}>
              <SelectTrigger className="flex-1 bg-card border-border rounded-xl h-10">
                <SelectValue placeholder="All decks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All decks</SelectItem>
                {vocabSets.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as StateFilter)}>
              <SelectTrigger className="flex-1 bg-card border-border rounded-xl h-10">
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
      </header>

      <main className="container max-w-2xl mx-auto px-4 pt-2">
        <div className="text-xs text-muted-foreground mb-3">{rows.length} card{rows.length === 1 ? '' : 's'}</div>
        {rows.length === 0 ? (
          <div className="bg-card rounded-2xl card-elev p-8 text-center text-muted-foreground text-sm">
            No cards match your filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map(r => (
              <li key={`${r.setId}-${r.word.id}`}>
                <button
                  onClick={() => setEditing(r)}
                  className="w-full text-left bg-card rounded-2xl card-elev p-4 hover:bg-accent transition-colors flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{r.word.korean}</span>
                      {r.word.romanization && (
                        <span className="text-xs text-muted-foreground">{r.word.romanization}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{r.word.uzbek}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {stateBadge(r.word)}
                      <span className="text-[10px] text-muted-foreground">· {r.setName}</span>
                    </div>
                  </div>
                  <Pencil className="h-4 w-4 text-muted-foreground mt-1" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit card {editing && <span className="text-xs text-muted-foreground font-normal">· {editing.setName}</span>}</DialogTitle>
          </DialogHeader>
          {editing && (
            <WordForm word={editing.word} onSave={handleSave} onCancel={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>
      <BottomNav active="browser" />
    </div>
  );
};

export default Browser;
