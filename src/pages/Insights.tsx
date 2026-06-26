import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Sparkles, GraduationCap, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet } from '@/types/word';
import { bucketCounts } from '@/lib/srs';
import BottomNav from '@/components/BottomNav';

interface StudySession { date: string; cards: number; minutes: number; }

const DAY_MS = 86400000;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const Insights = () => {
  const navigate = useNavigate();
  const [vocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [sessions] = useLocalStorage<StudySession[]>('study-sessions', []);

  const last7 = useMemo(() => {
    const out: { date: string; label: string; cards: number; minutes: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = dayKey(d);
      const s = sessions.find(x => x.date === key);
      out.push({
        date: key,
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        cards: s?.cards ?? 0,
        minutes: s?.minutes ?? 0,
      });
    }
    return out;
  }, [sessions]);

  const max = Math.max(1, ...last7.map(d => d.cards));
  const total7 = last7.reduce((a, b) => a + b.cards, 0);
  const avg = Math.round(total7 / 7);

  const streak = useMemo(() => {
    const set = new Set(sessions.filter(s => s.cards > 0).map(s => s.date));
    let n = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Count today only if studied; otherwise start from yesterday
    let cursor = set.has(dayKey(today)) ? new Date(today) : new Date(today.getTime() - DAY_MS);
    while (set.has(dayKey(cursor))) {
      n++;
      cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return n;
  }, [sessions]);

  const totals = vocabSets.reduce(
    (acc, s) => {
      const c = bucketCounts(s.words || []);
      acc.new += c.new; acc.learning += c.learning; acc.review += c.review; acc.due += c.due;
      return acc;
    },
    { new: 0, learning: 0, review: 0, due: 0 },
  );

  return (
    <div className="min-h-screen bg-background pb-28">

      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Insights</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 pt-2 space-y-6">
        {/* Streak + Avg */}
        <section className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl card-elev p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Flame className="h-4 w-4 text-due" /> Current streak
            </div>
            <div className="text-4xl font-bold mt-1 text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground mt-1">day{streak === 1 ? '' : 's'} in a row</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl card-elev p-4">
            <div className="text-xs font-medium text-muted-foreground">Last 7 days</div>
            <div className="text-4xl font-bold mt-1 text-foreground">{total7}</div>
            <div className="text-xs text-muted-foreground mt-1">cards • avg {avg}/day</div>
          </motion.div>
        </section>

        {/* Chart */}
        <section className="bg-card rounded-2xl card-elev p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Daily reviews</h2>
          <div className="flex items-end justify-between gap-2 h-44">
            {last7.map((d, i) => {
              const h = (d.cards / max) * 100;
              const isToday = i === last7.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[10px] font-medium text-muted-foreground h-4">
                    {d.cards > 0 ? d.cards : ''}
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                      className={`w-full rounded-t-lg min-h-[4px] ${isToday ? 'bg-primary' : 'bg-studied/70'}`}
                    />
                  </div>
                  <div className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Counters */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Card pool</h2>
          <div className="grid grid-cols-3 gap-3">
            <Counter icon={<Sparkles className="h-4 w-4" />} label="New" value={totals.new} className="bg-badge-new text-badge-new-foreground" />
            <Counter icon={<GraduationCap className="h-4 w-4" />} label="Learning" value={totals.learning} className="bg-badge-learning text-badge-learning-foreground" />
            <Counter icon={<RotateCw className="h-4 w-4" />} label="Review" value={totals.review} className="bg-badge-review text-badge-review-foreground" />
          </div>
          <div className="bg-card rounded-2xl card-elev p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Due now</div>
              <div className="text-3xl font-bold text-foreground mt-0.5">{totals.due}</div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              across {vocabSets.length} deck{vocabSets.length === 1 ? '' : 's'}
            </div>
          </div>
        </section>
      </main>
      <BottomNav active="insights" />
    </div>
  );
};

const Counter = ({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: number; className: string }) => (
  <div className={`rounded-2xl p-4 card-elev ${className}`}>
    <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">{icon}{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);

export default Insights;
