import { useState } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@/types/word';
import { CheckCircle2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  word: Word;
  isKnown?: boolean;
  onToggleKnown?: () => void;
}

const Flashcard = ({ word, isKnown, onToggleKnown }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word.korean);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto space-y-4">
      <motion.div
        className="relative w-full h-[400px] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative w-full flex items-center justify-center mb-4">
            <div className="text-6xl font-bold">{word.korean}</div>
            <button
              onClick={handleSpeak}
              className="absolute -right-4 top-0 p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Pronounce Korean word"
            >
              <Volume2 
                className={`h-6 w-6 ${isSpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} 
              />
            </button>
          </div>
          <div className="text-sm text-muted-foreground">Tap to flip</div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="space-y-4 text-center max-w-md">
            {word.uzbek && (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Uzbek</p>
                <p className="text-2xl font-semibold">{word.uzbek}</p>
              </div>
            )}
            {word.romanization && (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Romanization</p>
                <p className="text-xl">{word.romanization}</p>
              </div>
            )}
            {word.meaning && !word.uzbek && (
              <div className="text-3xl font-semibold mb-6">{word.meaning}</div>
            )}
            {word.example && (
              <div className="bg-muted/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground mb-1">Example</p>
                <p className="text-lg italic">"{word.example}"</p>
              </div>
            )}
          </div>
          <div className="mt-6 text-sm text-muted-foreground">Tap to flip back</div>
        </div>
      </motion.div>

      {/* Mark as Learned Button */}
      {onToggleKnown && (
        <div className="flex justify-center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleKnown();
            }}
            variant={isKnown ? "default" : "outline"}
            className="btn-glow"
            size="lg"
          >
            <CheckCircle2 className={`mr-2 h-5 w-5 ${isKnown ? 'fill-current' : ''}`} />
            {isKnown ? 'Learned ✓' : 'Mark as Learned'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;
