import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, RotateCcw, Volume2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet, Word } from '@/types/word';
import { Button } from '@/components/ui/button';
import { applyRating, previewIntervals, bucketCounts, Rating } from '@/lib/srs';
import { toast } from 'sonner';

interface StudySession { date: string; cards: number; minutes: number; }

const StudyMode = () => {
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [knownWords, setKnownWords] = useLocalStorage<number[]>('known-words', []);

  const currentSet = useMemo(() => vocabSets.find(s => s.id === setId) || null, [vocabSets, setId]);
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    if (!currentSet) { navigate('/'); return; }
    const now = Date.now();
    const due = (currentSet.words || []).filter(w => (w.due ?? 0) <= now);
    const list = due.length > 0 ? due : [...(currentSet.words || [])];
    setQueue(list.sort(() => Math.random() - 0.5));
    setIndex(0);
    setRevealed(false);
  }, [setId, currentSet, navigate]);

  const card = queue[index];
  const counts = currentSet ? bucketCounts(currentSet.words || []) : { new: 0, learning: 0, review: 0, due: 0 };
  const previews = card ? previewIntervals(card) : null;
  const total = queue.length;

  const recordSession = (extra = 1) => {
    const date = new Date().toISOString().slice(0, 10);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const others = sessions.filter(s => s.date !== date);
    const existing = sessions.find(s => s.date === date);
    setSessions([...others, {
      date,
      cards: (existing?.cards ?? 0) + extra,
      minutes: Math.max(existing?.minutes ?? 0, minutes),
    }]);
  };

  const handleRate = (rating: Rating) => {
    if (!card || !currentSet) return;
    const updated = applyRating(card, rating);
    // persist back into vocabSets
    const newSets = vocabSets.map(s => s.id === currentSet.id ? {
      ...s,
      words: s.words.map(w => w.id === card.id ? updated : w),
    } : s);
    setVocabSets(newSets);
    setStudiedCount(c => c + 1);
    recordSession(1);

    if (index + 1 >= queue.length) {
      toast.success('Session complete!');
      setTimeout(() => navigate('/'), 600);
    } else {
      setRevealed(false);
      setIndex(i => i + 1);
    }
  };

  const handleSpeak = () => {
    if (!card || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(card.korean);
    if (currentSet?.language) u.lang = currentSet.language;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const toggleKnown = () => {
    if (!card) return;
    if (knownWords.includes(card.id)) setKnownWords(knownWords.filter(id => id !== card.id));
    else setKnownWords([...knownWords, card.id]);
  };

  if (!card || !currentSet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">No cards in this deck.</p>
        <Button onClick={() => navigate('/')}>Back home</Button>
      </div>
    );
  }

  const progress = ((index + 1) / total) * 100;
  const isKnown = knownWords.includes(card.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground flex-1 truncate">{currentSet.name}</h1>
          <span className="px-2.5 py-1 rounded-full bg-badge-review text-badge-review-foreground text-xs font-medium">
            {counts.review} Review
          </span>
          <span className="px-2.5 py-1 rounded-full bg-badge-learning text-badge-learning-foreground text-xs font-medium">
            {counts.learning} Learning
          </span>
          <span className="text-sm text-muted-foreground font-medium">{index + 1} | {total}</span>
        </div>
        <div className="container max-w-2xl mx-auto px-4 pb-3 flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-badge-new text-badge-new-foreground text-xs font-medium">
            {counts.new} New
          </span>
          <button onClick={toggleKnown} className={`p-1.5 rounded-full ${isKnown ? 'text-primary' : 'text-muted-foreground'}`}>
            <Star className={`h-5 w-5 ${isKnown ? 'fill-current' : ''}`} />
          </button>
          <button onClick={() => { setRevealed(false); setIndex(0); }} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-5 w-5" />
          </button>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </header>

      {/* Card */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 flex flex-col">
        <motion.div
          key={card.id + (revealed ? '-back' : '-front')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl card-elev flex-1 min-h-[320px] p-8 flex flex-col items-center justify-center text-center relative"
        >
          <button
            onClick={handleSpeak}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Pronounce"
          >
            <Volume2 className="h-5 w-5" />
          </button>

          <div className="text-3xl md:text-4xl font-semibold text-foreground leading-snug">
            {card.korean}
          </div>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mt-8 space-y-3"
              >
                <div className="h-px bg-border w-24 mx-auto" />
                {card.uzbek && <div className="text-2xl font-medium text-foreground">{card.uzbek}</div>}
                {card.romanization && <div className="text-base text-muted-foreground">{card.romanization}</div>}
                {card.example && <div className="text-sm italic text-muted-foreground mt-2">"{card.example}"</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Actions */}
        <div className="mt-6">
          {!revealed ? (
            <Button
              onClick={() => setRevealed(true)}
              className="w-full h-14 text-base font-semibold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Show Answer
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              <RatingButton tone="muted" label="AGAIN" interval={previews!.again.label} onClick={() => handleRate('again')} />
              <RatingButton tone="destructive" label="HARD" interval={previews!.hard.label} onClick={() => handleRate('hard')} />
              <RatingButton tone="success" label="GOOD" interval={previews!.good.label} onClick={() => handleRate('good')} />
              <RatingButton tone="primary" label="EASY" interval={previews!.easy.label} onClick={() => handleRate('easy')} />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

const RatingButton = ({
  tone, label, interval, onClick,
}: {
  tone: 'muted' | 'destructive' | 'success' | 'primary';
  label: string;
  interval: string;
  onClick: () => void;
}) => {
  const tones = {
    muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
    success: 'bg-success text-success-foreground hover:opacity-90',
    primary: 'bg-studied text-studied-foreground hover:opacity-90',
  } as const;
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl py-3 px-2 flex flex-col items-center gap-0.5 transition ${tones[tone]}`}
    >
      <span className="text-xs font-bold tracking-wide">{label}</span>
      <span className="text-[11px] opacity-90">{interval}</span>
    </button>
  );
};

export default StudyMode;
