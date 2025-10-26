import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatsBox from '@/components/StatsBox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Word } from '@/types/word';

const Home = () => {
  const navigate = useNavigate();
  const [words] = useLocalStorage<Word[]>('korean-words', []);
  const [knownWords] = useLocalStorage<number[]>('known-words', []);

  const totalWords = words.length;
  const knownCount = knownWords.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showSettings />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-2">Korean Cards 🈶</h1>
            <p className="text-xl text-muted-foreground">
              Master Korean vocabulary, one card at a time
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <StatsBox label="Total Words" value={totalWords} icon={<BookOpen className="h-8 w-8" />} />
            <StatsBox label="Known Words" value={knownCount} icon={<span className="text-3xl">❤️</span>} />
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Button
              onClick={() => navigate('/add')}
              className="w-full h-16 text-lg btn-glow bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Word
            </Button>

            <Button
              onClick={() => navigate('/study')}
              disabled={totalWords === 0}
              className="w-full h-16 text-lg btn-glow bg-secondary text-secondary-foreground hover:bg-secondary/90"
              size="lg"
            >
              🎴 Study Mode
            </Button>

            <Button
              onClick={() => navigate('/words')}
              disabled={totalWords === 0}
              variant="outline"
              className="w-full h-16 text-lg btn-glow border-border hover:bg-accent"
              size="lg"
            >
              <List className="mr-2 h-5 w-5" />
              View Word List
            </Button>
          </motion.div>

          {totalWords === 0 && (
            <motion.div
              variants={itemVariants}
              className="text-center text-muted-foreground mt-8 p-6 bg-card border border-border rounded-xl"
            >
              <p className="text-lg">Get started by adding your first Korean word! 🚀</p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
