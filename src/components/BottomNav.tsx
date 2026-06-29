import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon, Search as SearchIcon, BarChart3, Settings as SettingsIcon,
  Plus, FolderPlus, FilePlus2, Download,
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
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setFabOpen(false)}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-card rounded-2xl shadow-xl p-2 w-60 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuRow icon={<Download className="h-5 w-5" />} label="Get shared decks"
                onClick={() => { setFabOpen(false); navigate('/settings'); }} />
              <MenuRow icon={<FolderPlus className="h-5 w-5" />} label="Create deck"
                onClick={() => { setFabOpen(false); setShowCreate(true); }} />
              <MenuRow icon={<FilePlus2 className="h-5 w-5" />} label="Create card"
                onClick={() => {
                  setFabOpen(false);
                  if (vocabSets[0]) navigate(`/words/${vocabSets[0].id}`);
                  else toast.info('Create a deck first');
                }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blurred fade underlay so content scrolling beneath the navbar is softened */}
      <div
        aria-hidden
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none h-32 backdrop-blur-md [mask-image:linear-gradient(to_top,black_35%,transparent)]"
      />

      {/* Telegram-style floating pill navbar */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-2 bg-card/90 backdrop-blur-xl border border-border/60 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <NavItem icon={<HomeIcon className="h-5 w-5" />} active={active === 'home'} onClick={() => navigate('/')} />
          <NavItem icon={<SearchIcon className="h-5 w-5" />} active={active === 'browser'} onClick={() => navigate('/browser')} />

          <button
            onClick={() => setFabOpen(o => !o)}
            className="mx-1 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center active:scale-90 transition-transform"
            aria-label={fabOpen ? 'Close menu' : 'Open menu'}
          >
            <motion.span
              animate={{ rotate: fabOpen ? 45 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center justify-center"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </motion.span>
          </button>

          <NavItem icon={<BarChart3 className="h-5 w-5" />} active={active === 'insights'} onClick={() => navigate('/insights')} />
          <NavItem icon={<SettingsIcon className="h-5 w-5" />} active={active === 'settings'} onClick={() => navigate('/settings')} />
        </nav>
      </div>
    </>
  );
};

const NavItem = ({
  icon, active, onClick,
}: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    {icon}
  </button>
);

const MenuRow = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left text-primary"
  >
    {icon}
    <span className="text-sm font-medium text-foreground">{label}</span>
  </button>
);

export default BottomNav;
