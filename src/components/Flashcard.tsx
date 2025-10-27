import { useState } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@/types/word';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  word: Word;
  isKnown?: boolean;
  onToggleKnown?: () => void;
}

const Flashcard = ({ word, isKnown, onToggleKnown }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

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
          <div className="text-6xl font-bold mb-4">{word.korean}</div>
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
