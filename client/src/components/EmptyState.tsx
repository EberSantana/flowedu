import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {illustration ? (
        <div className="mb-6 animate-scale-in">{illustration}</div>
      ) : Icon ? (
        <div className="mb-6 p-6 rounded-full bg-muted/50 animate-scale-in">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : null}

      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        {title}
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} className="animate-slide-in-up">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Ilustrações SVG para estados vazios comuns
export const EmptyIllustrations = {
  NoData: () => (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-50"
    >
      <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" />
      <path
        d="M70 100L90 120L130 80"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  ),
  NoResults: () => (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-50"
    >
      <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="2" />
      <line
        x1="110"
        y1="110"
        x2="140"
        y2="140"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="60"
        x2="100"
        y2="100"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  ),
  NoContent: () => (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-50"
    >
      <rect
        x="40"
        y="60"
        width="120"
        height="100"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="60"
        y1="90"
        x2="140"
        y2="90"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <line
        x1="60"
        y1="110"
        x2="120"
        y2="110"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <line
        x1="60"
        y1="130"
        x2="100"
        y2="130"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  ),
};
