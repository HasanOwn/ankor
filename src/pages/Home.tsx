import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import StatsBox from '@/components/StatsBox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet } from '@/types/word';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Search from '@/components/Search';
import CreateSetDialog from '@/components/CreateSetDialog';
import { useState } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);
  const [knownWords] = useLocalStorage<number[]>('known-words', []);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const totalWords = vocabSets.reduce((sum, set) => sum + (set.words?.length || 0), 0);
  const totalSets = vocabSets.length;
  const totalLearned = knownWords.length;
  const handleDeleteSet = (setId: string, setName: string) => {
    setVocabSets(vocabSets.filter(set => set.id !== setId));
    toast.success(`${setName} deleted`);
  };

  const handleCreateSet = (name: string) => {
    const newSet: VocabSet = {
      id: Date.now().toString(),
      name,
      words: [],
      createdAt: Date.now()
    };
    setVocabSets([...vocabSets, newSet]);
    toast.success(`${name} created!`);
    navigate(`/words/${newSet.id}`);
  };

  const getLearnedCount = (setId: string) => {
    const set = vocabSets.find(s => s.id === setId);
    if (!set?.words) return 0;
    return set.words.filter(word => knownWords.includes(word.id)).length;
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
      <Header showSettings showSearch onSearchClick={() => setShowSearch(true)} />
      
      {showSearch && <Search vocabSets={vocabSets} onClose={() => setShowSearch(false)} />}
      
      <CreateSetDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onCreateSet={handleCreateSet}
      />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            
            
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            <StatsBox label="Total Words" value={totalWords} icon={<BookOpen className="h-8 w-8" />} />
            <StatsBox label="Learned" value={totalLearned} icon={<CheckCircle2 className="h-8 w-8 text-success" />} />
            <StatsBox label="Total Sets" value={totalSets} icon={<span className="text-3xl">📚</span>} />
          </motion.div>

          {/* Vocab Sets List */}
          {vocabSets.length > 0 && <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xl font-semibold text-center mb-4">Your Vocabulary Sets</h2>
              {vocabSets.map(set => {
                const learnedCount = getLearnedCount(set.id);
                const totalWordsInSet = set.words?.length || 0;
                
                return <div key={set.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors">
                  <button onClick={() => navigate(`/study/${set.id}`)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📘</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{set.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{totalWordsInSet} words</span>
                          {totalWordsInSet > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-success">
                                Learned {learnedCount} / {totalWordsInSet}
                              </span>
                            </>
                          )}
                        </div>
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
                </div>;
              })}
            </motion.div>}

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="w-full h-16 text-lg btn-glow bg-primary text-primary-foreground hover:bg-primary/90" 
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Set
            </Button>
            <Button 
              onClick={() => navigate('/settings')} 
              variant="outline"
              className="w-full h-16 text-lg btn-glow" 
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Import Set
            </Button>
          </motion.div>

          {totalSets === 0 && <motion.div variants={itemVariants} className="text-center text-muted-foreground mt-8 p-6 bg-card border border-border rounded-xl">
              <p className="text-base font-normal">Get started by creating a new set or importing one!</p>
            </motion.div>}
        </motion.div>
      </main>
    </div>;
};
export default Home;