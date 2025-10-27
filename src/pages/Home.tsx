import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatsBox from '@/components/StatsBox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet } from '@/types/word';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
const Home = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const totalWords = vocabSets.reduce((sum, set) => sum + (set.words?.length || 0), 0);
  const totalSets = vocabSets.length;
  const handleDeleteSet = (setId: string, setName: string) => {
    setVocabSets(vocabSets.filter(set => set.id !== setId));
    toast.success(`${setName} deleted`);
  };
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  return <div className="min-h-screen bg-background">
      <Header showSettings />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            
            
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <StatsBox label="Total Words" value={totalWords} icon={<BookOpen className="h-8 w-8" />} />
            <StatsBox label="Total Sets" value={totalSets} icon={<span className="text-3xl">📚</span>} />
          </motion.div>

          {/* Vocab Sets List */}
          {vocabSets.length > 0 && <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xl font-semibold text-center mb-4">Your Vocabulary Sets</h2>
              {vocabSets.map(set => <div key={set.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors">
                  <button onClick={() => navigate(`/study/${set.id}`)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📘</span>
                      <div>
                        <h3 className="font-semibold text-lg">{set.name}</h3>
                        <p className="text-sm text-muted-foreground">{set.words?.length || 0} words</p>
                      </div>
                    </div>
                  </button>
                  
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/words/${set.id}`)} className="hover:bg-accent">
                    <Edit className="h-5 w-5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-destructive/20 hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {set.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          This will permanently delete this vocabulary set and all its words.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSet(set.id, set.name)} className="bg-destructive text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>)}
            </motion.div>}

          {/* Action Button */}
          <motion.div variants={itemVariants}>
            <Button onClick={() => navigate('/settings')} className="w-full h-16 text-lg btn-glow bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Import New Vocab Set
            </Button>
          </motion.div>

          {totalSets === 0 && <motion.div variants={itemVariants} className="text-center text-muted-foreground mt-8 p-6 bg-card border border-border rounded-xl">
              <p className="text-base font-normal">Get started by importing your first vocabulary set!</p>
            </motion.div>}
        </motion.div>
      </main>
    </div>;
};
export default Home;