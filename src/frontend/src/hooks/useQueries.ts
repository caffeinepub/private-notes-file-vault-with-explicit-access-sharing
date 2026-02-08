import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeActor } from './useSafeActor';
import type { UserProfile, NoteSub, Note, FileSub, File, PaywallStatus, AdminPaywallStatus } from '../backend';
import { Principal } from '@dfinity/principal';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, error: actorError } = useSafeActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !actorError,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
    error: actorError || query.error,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Paywall Queries
export function useGetCallerPaywallStatus() {
  const { actor, isFetching: actorFetching, error: actorError } = useSafeActor();

  const query = useQuery<PaywallStatus | null>({
    queryKey: ['paywallStatus'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerPaywallStatus();
      } catch (error: any) {
        // User not in paywall system yet
        if (error.message?.includes('User not in paywall')) {
          return null;
        }
        throw new Error(error.message || 'Failed to fetch paywall status');
      }
    },
    enabled: !!actor && !actorFetching && !actorError,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerAdmin() {
  const { actor, isFetching, error: actorError } = useSafeActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !actorError,
  });
}

export function useGetAllAdminPaywallStates() {
  const { actor, isFetching: actorFetching, error: actorError } = useSafeActor();

  return useQuery<AdminPaywallStatus[]>({
    queryKey: ['adminPaywallStates'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAllAdminPaywallStates();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch admin paywall states');
      }
    },
    enabled: !!actor && !actorFetching && !actorError,
    retry: false,
  });
}

export function useSetPaywallStatus() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      hasPaid,
      planLabel,
      paidUntil,
    }: {
      user: string;
      hasPaid: boolean;
      planLabel: string | null;
      paidUntil: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const userPrincipal = Principal.fromText(user);
      return actor.setPaywallStatus(userPrincipal, hasPaid, planLabel, paidUntil);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paywallStatus'] });
      queryClient.invalidateQueries({ queryKey: ['adminPaywallStates'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error: any) => {
      throw new Error(error.message || 'Failed to update paywall status');
    },
  });
}

// Notes Queries
export function useListNotes() {
  const { actor, isFetching, error: actorError } = useSafeActor();

  return useQuery<NoteSub[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listNotes();
      } catch (error: any) {
        if (error.message?.includes('need to pay')) {
          throw new Error('You need to pay to access storage');
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !actorError,
  });
}

export function useReadNote(id: string | null) {
  const { actor, isFetching, error: actorError } = useSafeActor();

  return useQuery<Note | null>({
    queryKey: ['note', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.readNote(id);
    },
    enabled: !!actor && !isFetching && !actorError && !!id,
  });
}

export function useCreateNote() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.createNote(title, content);
      } catch (error: any) {
        if (error.message?.includes('need to pay')) {
          throw new Error('You need to pay to access storage');
        }
        throw new Error(error.message || 'Failed to create note');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateNote(id, title, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Files Queries
export function useListFiles() {
  const { actor, isFetching, error: actorError } = useSafeActor();

  return useQuery<FileSub[]>({
    queryKey: ['files'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listFiles();
      } catch (error: any) {
        if (error.message?.includes('need to pay')) {
          throw new Error('You need to pay to access storage');
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !actorError,
  });
}

export function useGetFile(id: string | null) {
  const { actor, isFetching, error: actorError } = useSafeActor();

  return useQuery<File | null>({
    queryKey: ['file', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getFile(id);
    },
    enabled: !!actor && !isFetching && !actorError && !!id,
  });
}

export function useUploadFile() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName, blob }: { displayName: string; blob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.uploadFile(displayName, blob);
      } catch (error: any) {
        if (error.message?.includes('need to pay')) {
          throw new Error('You need to pay to access storage');
        }
        throw new Error(error.message || 'Failed to upload file');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useDeleteFile() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useUpdateFileMetadata() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, displayName, description }: { id: string; displayName: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFileMetadata(id, displayName, description);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file', variables.id] });
    },
  });
}

// Sharing Queries
export function useShareItem() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemType,
      id,
      recipient,
    }: {
      itemType: 'note' | 'file';
      id: string;
      recipient: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const recipientPrincipal = Principal.fromText(recipient);
      return actor.shareItem(itemType, id, recipientPrincipal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['file', variables.id] });
    },
  });
}

export function useRevokeAccess() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemType,
      id,
      recipient,
    }: {
      itemType: 'note' | 'file';
      id: string;
      recipient: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const recipientPrincipal = Principal.fromText(recipient);
      return actor.revokeAccess(itemType, id, recipientPrincipal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['file', variables.id] });
    },
  });
}
