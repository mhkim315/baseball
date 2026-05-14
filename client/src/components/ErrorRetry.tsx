import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorRetry({ message = "데이터를 불러오지 못했습니다", onRetry, className }: ErrorRetryProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 gap-4", className)}>
      <p className="text-muted-foreground text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
      >
        <RefreshCw size={14} />
        다시 시도
      </button>
    </div>
  );
}
