import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Word } from '@/types/word';

interface WordFormProps {
  word?: Word;
  onSave: (word: Omit<Word, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const WordForm = ({ word, onSave, onCancel }: WordFormProps) => {
  const [term, setTerm] = useState(word?.korean || '');
  const [translation, setTranslation] = useState(word?.uzbek || '');
  const [pronunciation, setPronunciation] = useState(word?.romanization || '');
  const [example, setExample] = useState(word?.example || '');

  useEffect(() => {
    if (word) {
      setTerm(word.korean);
      setTranslation(word.uzbek);
      setPronunciation(word.romanization);
      setExample(word.example || '');
    }
  }, [word]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !translation.trim()) return;
    onSave({
      ...word,
      set: word?.set,
      korean: term.trim(),
      uzbek: translation.trim(),
      romanization: pronunciation.trim(),
      example: example.trim() || undefined,
      meaning: translation.trim(),
      category: word?.category,
      isKnown: word?.isKnown || false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="term">Word / Term *</Label>
        <Input
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          required
          className="mt-1.5 bg-muted/60 border-0 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="translation">Translation *</Label>
        <Input
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          className="mt-1.5 bg-muted/60 border-0 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="pronunciation">Pronunciation (optional)</Label>
        <Input
          id="pronunciation"
          value={pronunciation}
          onChange={(e) => setPronunciation(e.target.value)}
          className="mt-1.5 bg-muted/60 border-0 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground" htmlFor="example">Example Sentence (optional)</Label>
        <Textarea
          id="example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          className="mt-1.5 bg-muted/60 border-0 rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-primary/40"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 h-11 rounded-xl">
          {word ? 'Update' : 'Add'} Word
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" className="flex-1 h-11 rounded-xl">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default WordForm;
