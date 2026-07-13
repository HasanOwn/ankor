import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { z } from 'zod';
import {
  ChevronRight, Download, Upload, Trash2, FileJson, Moon,
  ArrowLeft, Database, AlertTriangle, Info, ClipboardPaste, Check, Bell,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme, ACCENTS } from '@/components/ThemeProvider';
import { VocabSet } from '@/types/word';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getReminder, saveReminder, requestReminderPermission } from '@/lib/reminders';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const wordSchema = z.object({
  set: z.string().trim().max(100).optional(),
  korean: z.string().trim().min(1).max(200),
  uzbek: z.string().trim().min(1).max(200),
  romanization: z.string().trim().max(200).optional().default(''),
  example: z.string().trim().max(500).optional(),
  meaning: z.string().trim().max(200).optional(),
  category: z.string().trim().max(80).optional(),
});
const importSchema = z.array(wordSchema).min(1).max(500);

const vocabSetSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  language: z.string().optional(),
  words: z.array(z.object({
    id: z.number(),
    set: z.string().optional(),
    korean: z.string().min(1),
    uzbek: z.string().min(1),
    romanization: z.string().optional().default(''),
    meaning: z.string().optional(),
    example: z.string().optional(),
    category: z.string().optional(),
    createdAt: z.number(),
    isKnown: z.boolean().optional(),
  })),
  documents: z.array(z.any()).optional(),
  createdAt: z.number(),
});
const vocabSetsSchema = z.array(vocabSetSchema);

const Section = ({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="space-y-2"
  >
    {title && (
      <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
    )}
    <div className="bg-card rounded-2xl card-elev overflow-hidden divide-y divide-border/60">
      {children}
    </div>
  </motion.section>
);

const Row = ({
  icon, iconBg, title, subtitle, right, onClick, destructive,
}: {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left ${onClick ? 'hover:bg-muted/50 transition-colors' : ''}`}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg || 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${destructive ? 'text-destructive' : 'text-foreground'}`}>{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {right ?? (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />)}
    </Tag>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const { theme, setTheme, accent, setAccent } = useTheme();
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [reminder, setReminder] = useState(() => getReminder());

  const toggleReminder = async (v: boolean) => {
    if (v) {
      const ok = await requestReminderPermission();
      if (!ok) {
        toast.error('Enable notifications in your browser to use reminders');
        return;
      }
    }
    const next = { ...reminder, enabled: v };
    setReminder(next);
    saveReminder(next);
    toast.success(v ? `Reminder set for ${next.time}` : 'Reminder off');
  };

  const changeReminderTime = (time: string) => {
    const next = { ...reminder, time };
    setReminder(next);
    saveReminder(next);
  };

  const totalCards = vocabSets.reduce((a, s) => a + (s.words?.length || 0), 0);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(vocabSets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-sets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sets exported');
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const validated = vocabSetsSchema.parse(JSON.parse(e.target?.result as string)) as VocabSet[];
        setVocabSets(validated);
        toast.success('Sets imported');
      } catch (err) {
        if (err instanceof z.ZodError) toast.error(`Invalid: ${err.errors[0].message}`);
        else if (err instanceof SyntaxError) toast.error('Invalid JSON format');
        else toast.error('Error importing file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleJsonImport = () => {
    try {
      const validated = importSchema.parse(JSON.parse(jsonInput));
      const setName = validated[0]?.set || `Vocab ${vocabSets.length + 1}`;
      const words = validated.map((item, i) => ({
        id: Date.now() + i,
        set: item.set || setName,
        korean: item.korean,
        uzbek: item.uzbek,
        romanization: item.romanization || '',
        meaning: item.meaning || item.uzbek,
        example: item.example || '',
        category: item.category,
        createdAt: Date.now(),
        isKnown: false,
      }));
      setVocabSets([...vocabSets, { id: `set-${Date.now()}`, name: setName, words, createdAt: Date.now() }]);
      setJsonInput('');
      setJsonOpen(false);
      toast.success(`Imported ${words.length} words`);
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(`Invalid: ${err.errors[0].message}`);
      else if (err instanceof SyntaxError) toast.error('Invalid JSON format');
      else toast.error('Error processing data');
    }
  };

  const handleReset = () => {
    setVocabSets([]);
    toast.success('All data cleared');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 pt-2 space-y-6">
        <Section title="Appearance" delay={0}>
          <Row
            icon={<Moon className="h-4 w-4" />}
            iconBg="bg-primary/10 text-primary"
            title="Dark Mode"
            subtitle="Use a dark color palette"
            right={
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              />
            }
          />
          <div className="px-4 py-4">
            <div className="text-sm font-medium text-foreground mb-1">Accent color</div>
            <div className="text-xs text-muted-foreground mb-3">
              Personalize buttons, links & highlights
            </div>
            <div className="grid grid-cols-10 gap-2 place-items-center">
              {ACCENTS.map((a) => {
                const selected = accent === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setAccent(a.key)}
                    aria-label={a.name}
                    className={`relative h-7 w-7 rounded-full transition-transform ${
                      selected ? 'scale-110 ring-2 ring-offset-2 ring-offset-card ring-foreground/40' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: a.hex }}
                  >
                    {selected && (
                      <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Reminders" delay={0.03}>
          <Row
            icon={<Bell className="h-4 w-4" />}
            iconBg="bg-primary/10 text-primary"
            title="Daily reminder"
            subtitle="Get a notification to review your cards"
            right={
              <Switch
                checked={reminder.enabled}
                onCheckedChange={toggleReminder}
              />
            }
          />
          {reminder.enabled && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Reminder time</div>
                <div className="text-xs text-muted-foreground">Fires while the app is open</div>
              </div>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => changeReminderTime(e.target.value)}
                className="bg-muted text-foreground text-sm rounded-lg px-3 py-1.5 outline-none"
              />
            </div>
          )}
        </Section>


        <Section title="Data" delay={0.05}>
          <Row
            icon={<ClipboardPaste className="h-4 w-4" />}
            iconBg="bg-primary/10 text-primary"
            title="Paste JSON"
            subtitle="Quickly import words from clipboard"
            onClick={() => setJsonOpen(true)}
          />
          <Row
            icon={<Download className="h-4 w-4" />}
            iconBg="bg-studied/20 text-studied"
            title="Export sets"
            subtitle={`${vocabSets.length} deck${vocabSets.length === 1 ? '' : 's'} · ${totalCards} cards`}
            onClick={handleExport}
          />
          <Row
            icon={<Upload className="h-4 w-4" />}
            iconBg="bg-badge-review text-badge-review-foreground"
            title="Import from file"
            subtitle="Restore from a JSON backup"
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </Section>

        <Section title="About" delay={0.1}>
          <Row
            icon={<Info className="h-4 w-4" />}
            iconBg="bg-muted text-muted-foreground"
            title="AnKor"
            subtitle="Spaced repetition · v1.0"
          />
          <Row
            icon={<Database className="h-4 w-4" />}
            iconBg="bg-muted text-muted-foreground"
            title="Storage"
            subtitle={`${vocabSets.length} decks · ${totalCards} cards stored locally`}
          />
        </Section>

        <Section title="Danger Zone" delay={0.15}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-destructive">Reset all data</div>
                  <div className="text-xs text-muted-foreground">Permanently delete decks & progress</div>
                </div>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your decks, cards, and progress. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>
      </main>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste JSON</DialogTitle>
            <DialogDescription>Array of words to import as a new deck</DialogDescription>
          </DialogHeader>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[{"set":"My Set","korean":"term","uzbek":"translation"}]'
            className="min-h-[160px] font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonOpen(false)}>Cancel</Button>
            <Button onClick={handleJsonImport} disabled={!jsonInput.trim()}>
              <FileJson className="h-4 w-4 mr-2" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Settings;
