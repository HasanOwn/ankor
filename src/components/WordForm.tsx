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
  const [korean, setKorean] = useState(word?.korean || '');
  const [uzbek, setUzbek] = useState(word?.uzbek || '');
  const [romanization, setRomanization] = useState(word?.romanization || '');
  const [example, setExample] = useState(word?.example || '');

  useEffect(() => {
    if (word) {
      setKorean(word.korean);
      setUzbek(word.uzbek);
      setRomanization(word.romanization);
      setExample(word.example || '');
    }
  }, [word]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!korean.trim() || !uzbek.trim() || !romanization.trim()) {
      return;
    }
    onSave({
      set: word?.set,
      korean: korean.trim(),
      uzbek: uzbek.trim(),
      romanization: romanization.trim(),
      example: example.trim() || undefined,
      meaning: uzbek.trim(),
      isKnown: word?.isKnown || false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="korean">Korean (한글) *</Label>
        <Input
          id="korean"
          value={korean}
          onChange={(e) => setKorean(e.target.value)}
          placeholder="나라"
          required
          className="bg-secondary border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="uzbek">Uzbek Translation *</Label>
        <Input
          id="uzbek"
          value={uzbek}
          onChange={(e) => setUzbek(e.target.value)}
          placeholder="Davlat"
          required
          className="bg-secondary border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="romanization">Romanization *</Label>
        <Input
          id="romanization"
          value={romanization}
          onChange={(e) => setRomanization(e.target.value)}
          placeholder="nara"
          required
          className="bg-secondary border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="example">Example Sentence (optional)</Label>
        <Textarea
          id="example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="저는 학교에 가요"
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
