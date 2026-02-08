import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';

export default function AccessDeniedScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <Shield className="w-24 h-24 text-primary" />
            <Lock className="w-10 h-10 text-accent absolute bottom-0 right-0" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Secure Vault</h1>
          <p className="text-muted-foreground text-lg">
            Your private notes and files, protected with end-to-end encryption
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please authenticate to access your secure vault
          </p>
          <Button
            onClick={handleLogin}
            disabled={loginStatus === 'logging-in'}
            size="lg"
            className="w-full"
          >
            {loginStatus === 'logging-in' ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              'Login with Internet Identity'
            )}
          </Button>
        </div>
        <footer className="pt-8 text-xs text-muted-foreground">
          © 2026. Built with love using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

