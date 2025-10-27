import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings, Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
  showBack?: boolean;
  showSettings?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
}

const Header = ({
  showBack = false,
  showSettings = false,
  showSearch = false,
  onSearchClick
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="btn-glow">
              <ArrowLeft className="h-5 w-5" />
            </Button>}
          <h1 className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>AnKor</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch && <Button variant="ghost" size="icon" onClick={onSearchClick} className="btn-glow">
              <Search className="h-5 w-5" />
            </Button>}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-glow"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {showSettings && location.pathname === '/' && <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="btn-glow">
              <Settings className="h-5 w-5" />
            </Button>}
        </div>
      </div>
    </header>;
};
export default Header;