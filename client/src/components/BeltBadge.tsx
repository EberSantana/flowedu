import { cn } from "@/lib/utils";

interface BeltBadgeProps {
  belt: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-gray-100 text-gray-800 border-gray-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  green: "bg-green-100 text-green-800 border-green-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  brown: "bg-amber-100 text-amber-800 border-amber-300",
  black: "bg-gray-900 text-white border-gray-700",
};

const BELT_NAMES: Record<string, string> = {
  white: "Branca",
  yellow: "Amarela",
  orange: "Laranja",
  green: "Verde",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
};

export function BeltBadge({ belt, size = "md", showName = true, className }: BeltBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 font-semibold",
        BELT_COLORS[belt] || BELT_COLORS.white,
        sizeClasses[size],
        className
      )}
    >
      <span>🥋</span>
      {showName && <span>Faixa {BELT_NAMES[belt] || "Branca"}</span>}
    </div>
  );
}
