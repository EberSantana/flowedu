import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
      <div className="space-y-3">
        <div className="skeleton h-6 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-10 w-24 rounded" />
          <div className="skeleton h-10 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for list items
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border animate-fade-in">
      <div className="skeleton h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
      <div className="skeleton h-8 w-20 rounded" />
    </div>
  );
}

// Skeleton loader for table rows
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-fade-in">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

// Progress bar component
interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  animated?: boolean;
}

const colorClasses = {
  primary: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

export function ProgressBar({
  progress,
  showLabel = false,
  color = "primary",
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {clampedProgress}%
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} ${
            animated ? "transition-all duration-500 ease-out" : ""
          } rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
