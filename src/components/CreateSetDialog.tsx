import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSet: (name: string, language?: string) => void;
}

const LANGUAGES = [
  { code: '', label: 'Auto / Default' },
  { code: 'en-US', label: 'English' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-PT', label: 'Portuguese' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'tr-TR', label: 'Turkish' },
  { code: 'uz-UZ', label: 'Uzbek' },
];

const CreateSetDialog = ({ open, onOpenChange, onCreateSet }: CreateSetDialogProps) => {
  const [setName, setSetName] = useState('');
  const [language, setLanguage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setName.trim()) {
      onCreateSet(setName.trim(), language || undefined);
      setSetName('');
      setLanguage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create New Vocabulary Set</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Name your set and pick a language for pronunciation (optional).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="setName">Set Name</Label>
              <Input
                id="setName"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Pronunciation Language</Label>
              <Select value={language || 'auto'} onValueChange={(v) => setLanguage(v === 'auto' ? '' : v)}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Auto / Default" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code || 'auto'} value={l.code || 'auto'}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!setName.trim()}>Create Set</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSetDialog;
