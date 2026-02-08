import { useQuery } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { createActorWithConfig } from '../config';
import { withTimeout } from '../utils/async';
import type { backendInterface } from '../backend';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_INIT_TIMEOUT = 15000; // 15 seconds

export function useSafeActor() {
  const { identity, isInitializing } = useInternetIdentity();

  const query = useQuery<backendInterface | null, Error>({
    queryKey: ['safeActor', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) {
        return null;
      }

      try {
        // Wrap actor creation and initialization with timeout
        const actor = await withTimeout(
          (async () => {
            const actorOptions = {
              agentOptions: {
                identity,
              },
            };

            const newActor = await createActorWithConfig(actorOptions);
            const adminToken = getSecretParameter('caffeineAdminToken') || 'secure-vault-secret-2024';
            await newActor._initializeAccessControlWithSecret(adminToken);
            return newActor;
          })(),
          ACTOR_INIT_TIMEOUT,
          'Actor initialization timed out. Please check your connection and try again.'
        );

        return actor;
      } catch (error: any) {
        console.error('Actor initialization failed:', error);
        throw error;
      }
    },
    enabled: !isInitializing && !!identity,
    retry: false,
    staleTime: Infinity, // Actor should remain fresh once created
    gcTime: Infinity, // Keep in cache indefinitely
  });

  return {
    actor: query.data ?? null,
    isFetching: query.isLoading || query.isFetching,
    error: query.error,
    isError: query.isError,
  };
}
