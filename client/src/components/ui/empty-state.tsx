import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`bg-white shadow-lg ${className}`}>
      <CardContent className="py-16 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {description}
            </p>
          </div>
          {actionLabel && onAction && (
            <Button onClick={onAction} className="mt-4">
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
