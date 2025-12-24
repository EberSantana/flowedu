import { ReactNode } from 'react';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  const { isCompact } = useSidebarContext();
  
  return (
    <div className={`${className} ${isCompact ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
      {children}
    </div>
  );
}
