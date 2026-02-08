import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useSafeActor } from './hooks/useSafeActor';
import { useQueryClient } from '@tanstack/react-query';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AccessDeniedScreen from './components/auth/AccessDeniedScreen';
import InitializationErrorScreen from './components/auth/InitializationErrorScreen';
import VaultLayout from './components/layout/VaultLayout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { error: actorError, isFetching: actorFetching } = useSafeActor();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    error: profileError,
  } = useGetCallerUserProfile();

  // Handle retry for initialization errors
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['safeActor'] });
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
  };

  // Show loading during initialization
  if (loginStatus === 'initializing' || (isAuthenticated && actorFetching && !actorError)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading secure vault...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show error screen if actor initialization failed
  if (isAuthenticated && actorError) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <InitializationErrorScreen error={actorError} onRetry={handleRetry} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show error screen if profile fetch failed (after actor is ready)
  if (isAuthenticated && !actorFetching && profileError) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <InitializationErrorScreen error={profileError as Error} onRetry={handleRetry} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show login screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AccessDeniedScreen />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup modal if user doesn't have a profile yet
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <VaultLayout />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}
