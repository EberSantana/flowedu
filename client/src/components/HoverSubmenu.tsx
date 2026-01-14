import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  adminOnly?: boolean;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  adminOnly?: boolean;
}

interface HoverSubmenuProps {
  category: NavCategory;
  onNavigate?: () => void;
}

export function HoverSubmenu({ category, onNavigate }: HoverSubmenuProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [delayedOpen, setDelayedOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasActiveItem = category.items.some(item => location === item.href);
  
  const handleMouseEnter = () => {
    // Cancelar timeout de fechamento se existir
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // Delay de 200ms para abrir
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      // Pequeno delay adicional para animação
      setTimeout(() => setDelayedOpen(true), 10);
    }, 200);
  };
  
  const handleMouseLeave = () => {
    // Cancelar timeout de abertura se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Delay de 100ms para fechar (permite mover para o submenu)
    closeTimeoutRef.current = setTimeout(() => {
      setDelayedOpen(false);
      setTimeout(() => setIsOpen(false), 150);
    }, 100);
  };
  
  const handleSubmenuMouseEnter = () => {
    // Cancelar timeout de fechamento quando entrar no submenu
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };
  
  const handleSubmenuMouseLeave = () => {
    // Fechar imediatamente ao sair do submenu
    setDelayedOpen(false);
    setTimeout(() => setIsOpen(false), 150);
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);
  
  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ícone da categoria */}
      <div
        className={cn(
          "flex items-center justify-center p-3 rounded-xl relative group cursor-pointer",
          "transition-all duration-200",
          hasActiveItem
            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            : "text-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md"
        )}
      >
        <span className="transition-transform duration-200 group-hover:scale-110">
          {category.icon}
        </span>
      </div>
      
      {/* Submenu flutuante */}
      {isOpen && (
        <div
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
          className={cn(
            "absolute left-full top-0 ml-2 z-50",
            "bg-popover border border-border rounded-xl shadow-xl",
            "min-w-[200px] py-2",
            "transition-all duration-150 ease-out",
            delayedOpen 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-2 pointer-events-none"
          )}
        >
          {/* Seta conectora */}
          <div className="absolute -left-2 top-3 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-popover" />
          <div className="absolute -left-[9px] top-3 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-border" />
          
          {/* Header da categoria */}
          <div className="px-3 py-2 border-b border-border mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {category.label}
            </span>
          </div>
          
          {/* Itens do submenu */}
          <div className="px-1">
            {category.items.map((item) => {
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setDelayedOpen(false);
                    setTimeout(() => setIsOpen(false), 150);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg",
                    "transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="opacity-80">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
