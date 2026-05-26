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
        <Label htmlFor="term">Word / Term *</Label>
        <Input
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          required
          className="bg-secondary border-border"
        />
      </div>

      <div>
        <Label htmlFor="translation">Translation *</Label>
        <Input
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          className="bg-secondary border-border"
        />
      </div>

      <div>
        <Label htmlFor="pronunciation">Pronunciation (optional)</Label>
        <Input
          id="pronunciation"
          value={pronunciation}
          onChange={(e) => setPronunciation(e.target.value)}
          className="bg-secondary border-border"
        />
      </div>

      <div>
        <Label htmlFor="example">Example Sentence (optional)</Label>
        <Textarea
          id="example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          className="bg-secondary border-border"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground">
          {word ? 'Update' : 'Add'} Word
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default WordForm;
