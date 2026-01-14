import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Detectar se é desktop (lg breakpoint = 1024px)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  
  // Estado de compactação - só é usado em mobile
  const [isCompactState, setIsCompactState] = useState(() => {
    const saved = localStorage.getItem('sidebar-compact');
    return saved === 'true';
  });

  // Em desktop, sempre retorna false (menu expandido)
  // Em mobile, usa o estado salvo
  const isCompact = isDesktop ? false : isCompactState;

  // Listener para mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-compact', String(isCompactState));
  }, [isCompactState]);

  const setIsCompact = (value: boolean) => {
    // Só permite compactar em mobile
    if (!isDesktop) {
      setIsCompactState(value);
    }
  };

  return (
    <SidebarContext.Provider value={{ isCompact, setIsCompact, isDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}
