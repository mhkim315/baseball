import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = "오류", message = "데이터를 불러오지 못했습니다", onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <AlertTriangle size={32} className="text-destructive/60" />
      <div className="text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm">
          <RefreshCw size={14} />
          다시 시도
        </button>
      )}
    </div>
  );
}
