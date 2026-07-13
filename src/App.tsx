import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeProvider } from "./components/ThemeProvider";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import StudyMode from "./pages/StudyMode";
import WordList from "./pages/WordList";
import Insights from "./pages/Insights";
import Browser from "./pages/Browser";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import { useEffect } from "react";
import { scheduleReminder } from "./lib/reminders";

const queryClient = new QueryClient();

const PageWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const NAV_ROUTES: Record<string, 'home' | 'browser' | 'insights' | 'settings'> = {
  '/': 'home',
  '/browser': 'browser',
  '/insights': 'insights',
  '/settings': 'settings',
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navTab = NAV_ROUTES[location.pathname];
  return (
    <>
      <Routes location={location}>
        <Route path="/" element={<PageWrap><Home /></PageWrap>} />
        <Route path="/study/:setId" element={<PageWrap><StudyMode /></PageWrap>} />
        <Route path="/words/:setId" element={<PageWrap><WordList /></PageWrap>} />
        <Route path="/settings" element={<PageWrap><Settings /></PageWrap>} />
        <Route path="/insights" element={<PageWrap><Insights /></PageWrap>} />
        <Route path="/browser" element={<PageWrap><Browser /></PageWrap>} />
        <Route path="/add" element={<Navigate to="/settings" replace />} />
        <Route path="/words" element={<Navigate to="/" replace />} />
        <Route path="/study" element={<Navigate to="/" replace />} />
        <Route path="*" element={<PageWrap><NotFound /></PageWrap>} />
      </Routes>
      {navTab && <BottomNav active={navTab} />}
    </>
  );
};

const App = () => {
  useEffect(() => { scheduleReminder(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
