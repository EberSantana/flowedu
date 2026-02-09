import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        {showHome && (
          <>
            <li>
              <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
                <span className="sr-only md:not-sr-only">Início</span>
              </Link>
            </li>
            {items.length > 0 && (
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </>
        )}
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground font-medium" : ""}>
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <ChevronRight className="h-4 w-4" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
