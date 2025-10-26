import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import WordForm from '@/components/WordForm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Word } from '@/types/word';
import { toast } from 'sonner';

const AddWord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editWord = location.state?.word as Word | undefined;
  
  const [words, setWords] = useLocalStorage<Word[]>('korean-words', []);

  const handleSave = (wordData: Omit<Word, 'id' | 'createdAt'>) => {
    if (editWord) {
      // Update existing word
      setWords(words.map(w => 
        w.id === editWord.id 
          ? { ...w, ...wordData }
          : w
      ));
      toast.success('Word updated successfully! ✅');
    } else {
      // Add new word
      const newWord: Word = {
        ...wordData,
        id: Date.now(),
        createdAt: Date.now(),
      };
      setWords([...words, newWord]);
      toast.success('Word added successfully! ✅');
    }
    
    navigate('/');
  };

  const handleCancel = () => {
    navigate(-1);
  };

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
            <h1 className="text-4xl font-bold mb-2">
              {editWord ? 'Edit Word' : 'Add New Word'}
            </h1>
            <p className="text-muted-foreground">
              {editWord ? 'Update the word details' : 'Add a new Korean word to your collection'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <WordForm
              word={editWord}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AddWord;
