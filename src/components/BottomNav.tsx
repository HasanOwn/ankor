import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon, Search as SearchIcon, BarChart3, Settings as SettingsIcon,
  Plus, X, FolderPlus, FilePlus2, Download,
} from 'lucide-react';
import CreateSetDialog from '@/components/CreateSetDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { VocabSet } from '@/types/word';
import { toast } from 'sonner';

type Tab = 'home' | 'browser' | 'insights' | 'settings';

interface BottomNavProps {
  active: Tab;
}

const BottomNav = ({ active }: BottomNavProps) => {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [vocabSets, setVocabSets] = useLocalStorage<VocabSet[]>('korean-vocab-sets', []);

  const handleCreateSet = (name: string, language?: string) => {
    const newSet: VocabSet = { id: Date.now().toString(), name, words: [], language, createdAt: Date.now() };
    setVocabSets([...vocabSets, newSet]);
    toast.success(`${name} created`);
    setTimeout(() => navigate(`/words/${newSet.id}`), 100);
  };

  return (
    <>
      <CreateSetDialog open={showCreate} onOpenChange={setShowCreate} onCreateSet={handleCreateSet} />

      {/* FAB menu overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-end justify-center pb-32"
            onClick={() => setFabOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-card rounded-2xl card-elev p-2 w-64 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setFabOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left"
              >
                <Download className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Get shared decks</span>
              </button>
              <button
                onClick={() => { setFabOpen(false); setShowCreate(true); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left"
              >
                <FolderPlus className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Create deck</span>
              </button>
              <button
                onClick={() => {
                  setFabOpen(false);
                  if (vocabSets[0]) navigate(`/words/${vocabSets[0].id}`);
                  else toast.info('Create a deck first');
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left"
              >
                <FilePlus2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Create card</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS / Telegram style tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-card/85 backdrop-blur-xl border-t border-border/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="container max-w-2xl mx-auto px-4 py-2 flex items-center justify-around relative">
          <NavItem icon={<HomeIcon className="h-[22px] w-[22px]" />} label="Home" active={active === 'home'} onClick={() => navigate('/')} />
          <NavItem icon={<SearchIcon className="h-[22px] w-[22px]" />} label="Browser" active={active === 'browser'} onClick={() => navigate('/browser')} />
          <div className="w-14" />
          <NavItem icon={<BarChart3 className="h-[22px] w-[22px]" />} label="Insights" active={active === 'insights'} onClick={() => navigate('/insights')} />
          <NavItem icon={<SettingsIcon className="h-[22px] w-[22px]" />} label="Settings" active={active === 'settings'} onClick={() => navigate('/settings')} />

          <button
            onClick={() => setFabOpen(o => !o)}
            className="absolute left-1/2 top-3 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Add"
          >
            <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} className="flex items-center justify-center">
              {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </motion.div>
          </button>
        </div>
      </nav>
    </>
  );
};

const NavItem = ({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default BottomNav;
