import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Word } from '@/types/word';
import { motion } from 'framer-motion';

interface WordFormProps {
  word?: Word;
  onSave: (word: Omit<Word, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const WordForm = ({ word, onSave, onCancel }: WordFormProps) => {
  const [korean, setKorean] = useState(word?.korean || '');
  const [meaning, setMeaning] = useState(word?.meaning || '');
  const [example, setExample] = useState(word?.example || '');
  const [errors, setErrors] = useState({ korean: '', meaning: '' });

  useEffect(() => {
    if (word) {
      setKorean(word.korean);
      setMeaning(word.meaning);
      setExample(word.example || '');
    }
  }, [word]);

  const validateForm = () => {
    const newErrors = { korean: '', meaning: '' };
    let isValid = true;

    if (!korean.trim()) {
      newErrors.korean = 'Korean word is required';
      isValid = false;
    }

    if (!meaning.trim()) {
      newErrors.meaning = 'Meaning is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        korean: korean.trim(),
        meaning: meaning.trim(),
        example: example.trim() || undefined,
      });
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="space-y-2">
        <Label htmlFor="korean" className="text-foreground">Korean Word (한글)*</Label>
        <Input
          id="korean"
          value={korean}
          onChange={(e) => setKorean(e.target.value)}
          placeholder="학교"
          className="bg-card border-border text-foreground text-lg"
        />
        {errors.korean && <p className="text-destructive text-sm">{errors.korean}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="meaning" className="text-foreground">Meaning (English or Uzbek)*</Label>
        <Input
          id="meaning"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="school / maktab"
          className="bg-card border-border text-foreground text-lg"
        />
        {errors.meaning && <p className="text-destructive text-sm">{errors.meaning}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="example" className="text-foreground">Example Sentence (optional)</Label>
        <Textarea
          id="example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="저는 학교에 가요"
          className="bg-card border-border text-foreground min-h-[100px]"
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          className="flex-1 btn-glow bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {word ? '🔄 Update Word' : '✅ Save Word'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 btn-glow border-border hover:bg-accent"
        >
          ↩️ Cancel
        </Button>
      </div>
    </motion.form>
  );
};

export default WordForm;
