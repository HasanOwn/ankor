import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Word } from '@/types/word';

interface WordTableProps {
  words: Word[];
  onEdit: (word: Word) => void;
  onDelete: (id: number) => void;
}

const WordTable = ({ words, onEdit, onDelete }: WordTableProps) => {
  if (words.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No words found. Start adding some!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 text-muted-foreground font-medium">Korean</th>
            <th className="text-left p-4 text-muted-foreground font-medium">Meaning</th>
            <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Example</th>
            <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word, index) => (
            <motion.tr
              key={word.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-border hover:bg-accent/50 transition-colors"
            >
              <td className="p-4 font-medium text-lg">{word.korean}</td>
              <td className="p-4">{word.meaning}</td>
              <td className="p-4 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                {word.example || '-'}
              </td>
              <td className="p-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(word)}
                    className="btn-glow h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(word.id)}
                    className="btn-glow h-8 w-8 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WordTable;
