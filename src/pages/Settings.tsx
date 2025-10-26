import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, FileJson } from 'lucide-react';
import { useState } from 'react';
import Header from '@/components/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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

const Settings = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [jsonInput, setJsonInput] = useState('');

  const handleExport = () => {
    const dataStr = JSON.stringify(vocabSets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `korean-cards-${new Date().toISOString().split('T')[0]}.json`;
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
        if (Array.isArray(importedData)) {
          setVocabSets(importedData);
          toast.success('Sets imported successfully! ✅');
        } else {
          toast.error('Invalid file format');
        }
      } catch (error) {
        toast.error('Error importing file');
      }
    };
    reader.readAsText(file);
  };

  const handleJsonImport = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        toast.error('Invalid format: Must be a non-empty array');
        return;
      }

      const setName = parsedData[0]?.set || `Vocab ${vocabSets.length + 1}`;
      const setId = `set-${Date.now()}`;

      const importedWords = parsedData.map((item, index) => ({
        id: Date.now() + index,
        set: item.set || setName,
        korean: item.korean || '',
        uzbek: item.uzbek || '',
        romanization: item.romanization || '',
        meaning: item.meaning || item.uzbek || '',
        example: item.example || '',
        createdAt: Date.now(),
        isKnown: false
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
      toast.error('Invalid JSON format');
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
            {/* JSON Paste Import */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Paste JSON Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste JSON array to import words instantly
              </p>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"set": "Vocab 1", "uzbek": "Davlat", "korean": "나라", "romanization": "nara"}]'
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
