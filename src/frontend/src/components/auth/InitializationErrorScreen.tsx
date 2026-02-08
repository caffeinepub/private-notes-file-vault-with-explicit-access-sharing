import { Button } from '@/components/ui/button';
import ErrorBanner from '../common/ErrorBanner';
import { RefreshCw } from 'lucide-react';

interface InitializationErrorScreenProps {
  error: Error;
  onRetry: () => void;
}

export default function InitializationErrorScreen({
  error,
  onRetry,
}: InitializationErrorScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Initialization Failed</h1>
          <p className="text-muted-foreground">
            We couldn't connect to the secure vault. This might be due to a network issue or a
            temporary service problem.
          </p>
        </div>

        <ErrorBanner
          title="Connection Error"
          message={error.message || 'Failed to initialize the vault'}
        />

        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            If the problem persists, try refreshing your browser or checking your internet
            connection.
          </p>
        </div>
      </div>
    </div>
  );
}
