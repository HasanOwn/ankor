import { useState } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@/types/word';

interface FlashcardProps {
  word: Word;
}

const Flashcard = ({ word }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-full max-w-2xl mx-auto">
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
          <div className="text-3xl font-semibold mb-6 text-center">{word.meaning}</div>
          {word.example && (
            <div className="text-lg text-muted-foreground text-center italic max-w-md">
              "{word.example}"
            </div>
          )}
          <div className="mt-6 text-sm text-muted-foreground">Tap to flip back</div>
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;
