import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { forwardRef, ComponentPropsWithoutRef, ReactNode } from "react";

interface LoadingButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  loading?: boolean;
  loadingText?: string;
  children?: ReactNode;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
