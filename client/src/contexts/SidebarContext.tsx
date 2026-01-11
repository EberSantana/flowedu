import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('sidebar-compact');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-compact', String(isCompact));
  }, [isCompact]);

  return (
    <SidebarContext.Provider value={{ isCompact, setIsCompact }}>
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
