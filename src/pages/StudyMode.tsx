import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Flashcard from '@/components/Flashcard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Word } from '@/types/word';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const StudyMode = () => {
  const navigate = useNavigate();
  const [words] = useLocalStorage<Word[]>('korean-words', []);
  const [knownWords, setKnownWords] = useLocalStorage<number[]>('known-words', []);
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('study-index', 0);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);

  useEffect(() => {
    if (words.length === 0) {
      navigate('/');
      return;
    }

    // Shuffle words on mount
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, []);

  const currentWord = shuffledWords[currentIndex];
  const isKnown = currentWord ? knownWords.includes(currentWord.id) : false;

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    toast.success('Cards shuffled! 🔄');
  };

  const toggleKnown = () => {
    if (!currentWord) return;

    if (isKnown) {
      setKnownWords(knownWords.filter(id => id !== currentWord.id));
      toast.success('Removed from known words');
    } else {
      setKnownWords([...knownWords, currentWord.id]);
      toast.success('Marked as known! ❤️');
    }
  };

  if (!currentWord) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            {currentWord?.set && (
              <div className="text-sm text-muted-foreground mb-2">{currentWord.set}</div>
            )}
            <h1 className="text-4xl font-bold mb-2">Study Mode</h1>
            <p className="text-muted-foreground">
              Card {currentIndex + 1} of {shuffledWords.length}
            </p>
          </div>

          {/* Flashcard */}
          <Flashcard word={currentWord} />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="btn-glow w-full sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>

            <Button
              onClick={toggleKnown}
              variant={isKnown ? "default" : "outline"}
              className="btn-glow w-full sm:w-auto"
            >
              <Heart className={`mr-2 h-5 w-5 ${isKnown ? 'fill-current' : ''}`} />
              {isKnown ? 'Known' : 'Mark as Known'}
            </Button>

            <Button
              onClick={handleShuffle}
              variant="outline"
              className="btn-glow w-full sm:w-auto"
            >
              <Shuffle className="mr-2 h-5 w-5" />
              Shuffle
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === shuffledWords.length - 1}
              variant="outline"
              className="btn-glow w-full sm:w-auto"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / shuffledWords.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default StudyMode;
