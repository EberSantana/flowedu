import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface EnhancedToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-900 dark:text-green-100",
    messageColor: "text-green-700 dark:text-green-300",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-900 dark:text-red-100",
    messageColor: "text-red-700 dark:text-red-300",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    titleColor: "text-yellow-900 dark:text-yellow-100",
    messageColor: "text-yellow-700 dark:text-yellow-300",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-900 dark:text-blue-100",
    messageColor: "text-blue-700 dark:text-blue-300",
  },
};

export function EnhancedToast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: EnhancedToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        border-l-4 rounded-lg shadow-lg p-4 min-w-[320px] max-w-md
        ${isExiting ? "animate-slide-out-right" : "animate-slide-in-right"}
        transition-all duration-300
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${config.titleColor} font-semibold text-sm mb-1`}>
            {title}
          </h4>
          {message && (
            <p className={`${config.messageColor} text-sm`}>{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {duration > 0 && (
        <div className="mt-2 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.iconColor.replace("text-", "bg-")} animate-progress`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

// Container for toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}

// Animation for slide out
const slideOutRightKeyframes = `
@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.animate-slide-out-right {
  animation: slideOutRight 0.3s ease-out forwards;
}
`;

// Inject animation styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = slideOutRightKeyframes;
  document.head.appendChild(style);
}
