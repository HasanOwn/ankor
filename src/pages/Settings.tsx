import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, FileJson, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import Header from '@/components/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/components/ThemeProvider';
import { VocabSet } from '@/types/word';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Zod schema for validating imported word data (legacy field names kept for compatibility:
// korean = term, uzbek = translation, romanization = pronunciation)
const wordSchema = z.object({
  set: z.string().trim().max(100).optional(),
  korean: z.string().trim().min(1, "Word/term is required").max(200),
  uzbek: z.string().trim().min(1, "Translation is required").max(200),
  romanization: z.string().trim().max(200).optional().default(''),
  example: z.string().trim().max(500).optional(),
  meaning: z.string().trim().max(200).optional(),
  category: z.string().trim().max(80).optional(),
});

const importSchema = z.array(wordSchema).min(1, "Must have at least one word").max(500, "Cannot import more than 500 words at once");

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

const Settings = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [jsonInput, setJsonInput] = useState('');
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    const dataStr = JSON.stringify(vocabSets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocab-sets-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Sets exported successfully! ✅');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate the imported data structure
        const validatedData = vocabSetsSchema.parse(importedData) as VocabSet[];
        
        setVocabSets(validatedData);
        toast.success('Sets imported successfully! ✅');
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          toast.error(`Invalid data: ${firstError.message}`);
        } else if (error instanceof SyntaxError) {
          toast.error('Invalid JSON format');
        } else {
          toast.error('Error importing file');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleJsonImport = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      
      // Validate the parsed data against schema
      const validatedData = importSchema.parse(parsedData);

      const setName = validatedData[0]?.set || `Vocab ${vocabSets.length + 1}`;
      const setId = `set-${Date.now()}`;

      const importedWords = validatedData.map((item, index) => ({
        id: Date.now() + index,
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

      const newSet: VocabSet = {
        id: setId,
        name: setName,
        words: importedWords,
        createdAt: Date.now()
      };

      setVocabSets([...vocabSets, newSet]);
      setJsonInput('');
      toast.success(`JSON imported successfully ✅ (${importedWords.length} words)`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(`Invalid data: ${firstError.message}`);
      } else if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      } else {
        toast.error('Error processing data');
      }
    }
  };

  const handleReset = () => {
    setVocabSets([]);
    toast.success('All data cleared! 🗑️');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      
      <main className="container max-w-2xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your data and preferences
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Theme Toggle */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Switch between light and dark mode
              </p>
              <Button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                variant="outline"
                className="w-full btn-glow"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-5 w-5" />
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-5 w-5" />
                    Switch to Dark Mode
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* JSON Paste Import */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Paste JSON Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste JSON array to import words instantly
              </p>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"set": "My Set", "korean": "term", "uzbek": "translation", "romanization": "optional"}]'
                className="min-h-[120px] font-mono text-sm"
              />
              <Button
                onClick={handleJsonImport}
                disabled={!jsonInput.trim()}
                className="w-full btn-glow bg-primary text-primary-foreground mt-2"
              >
                <FileJson className="mr-2 h-5 w-5" />
                Import JSON
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Export */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Export Words</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download your words as a JSON file
              </p>
              <Button
                onClick={handleExport}
                disabled={vocabSets.length === 0}
                className="w-full btn-glow bg-primary text-primary-foreground"
              >
                <Download className="mr-2 h-5 w-5" />
                Export All Sets
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Import */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Import Words</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a JSON file to restore your words
              </p>
              <label htmlFor="import-file" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full btn-glow"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Import Words
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-border" />

            {/* Reset */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clear all data from the app (this cannot be undone)
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Reset All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This will permanently delete all your words, progress, and settings.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
