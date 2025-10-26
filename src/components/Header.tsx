import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showBack?: boolean;
  showSettings?: boolean;
}

const Header = ({ showBack = false, showSettings = false }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="btn-glow"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 
            className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            Korean Cards 🈶
          </h1>
        </div>
        
        {showSettings && location.pathname === '/' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="btn-glow"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
