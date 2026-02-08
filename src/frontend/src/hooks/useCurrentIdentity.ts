import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export function useCurrentIdentity() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const principalString = isAuthenticated ? identity.getPrincipal().toString() : null;

  const logout = async () => {
    await clear();
    queryClient.clear();
  };

  return {
    isAuthenticated,
    principal: principalString,
    identity,
    logout,
  };
}

