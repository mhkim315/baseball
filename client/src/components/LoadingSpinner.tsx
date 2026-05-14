import { Spinner } from "@/components/ui/spinner";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Spinner className="size-6" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
