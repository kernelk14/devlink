import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// ==================== USERS ====================

const USERS_QUERY_KEY = ['users'];

export function useUsers() {
  const queryClient = useQueryClient();
  
  // Use Convex query
  const convexUsers = useConvexQuery(api.users.getUsers);
  
  // Use TanStack Query for caching and offline support
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      // If Convex data is available, return it
      if (convexUsers) {
        return convexUsers;
      }
      // Otherwise, return cached data (handled automatically by TanStack Query)
      throw new Error('Waiting for Convex data...');
    },
    // Use Convex data directly when available
    placeholderData: convexUsers,
    // Don't refetch on window focus (Convex handles real-time)
    refetchOnWindowFocus: false,
    // Keep previous data while loading
    placeholderData: (previousData) => previousData,
  });
}

export function useUser(userId: string | undefined) {
  const convexUser = useConvexQuery(
    api.users.getUser,
    userId ? { userId: userId as any } : 'skip'
  );
  
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (convexUser) return convexUser;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!userId,
    placeholderData: convexUser,
    refetchOnWindowFocus: false,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const createUserConvex = useConvexMutation(api.users.createUser);
  
  return useMutation({
    mutationFn: createUserConvex,
    onSuccess: () => {
      // Invalidate users query to refetch
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const updateStatusConvex = useConvexMutation(api.users.updateUserStatus);
  
  return useMutation({
    mutationFn: async ({ userId, status, statusMessage }: { 
      userId: string; 
      status: string; 
      statusMessage?: string;
    }) => {
      return await updateStatusConvex({
        userId: userId as any,
        status: status as any,
        statusMessage,
      });
    },
    onMutate: async ({ userId, status, statusMessage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', userId] });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', userId]);
      
      // Optimistically update
      queryClient.setQueryData(['users', userId], (old: any) => ({
        ...old,
        status,
        statusMessage,
        updatedAt: Date.now(),
      }));
      
      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['users', variables.userId], context.previousUser);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

// ==================== CHANNELS ====================

const CHANNELS_QUERY_KEY = ['channels'];

export function useChannels(orgId?: string) {
  const convexChannels = useConvexQuery(
    api.channels.getChannels,
    orgId ? { orgId } : {}
  );
  
  return useQuery({
    queryKey: [CHANNELS_QUERY_KEY, orgId],
    queryFn: async () => {
      if (convexChannels) return convexChannels;
      throw new Error('Waiting for Convex data...');
    },
    placeholderData: convexChannels,
    refetchOnWindowFocus: false,
  });
}

export function useChannel(channelId: string | undefined) {
  const convexChannel = useConvexQuery(
    api.channels.getChannel,
    channelId ? { channelId: channelId as any } : 'skip'
  );
  
  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: async () => {
      if (convexChannel) return convexChannel;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!channelId,
    placeholderData: convexChannel,
    refetchOnWindowFocus: false,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  const createChannelConvex = useConvexMutation(api.channels.createChannel);
  
  return useMutation({
    mutationFn: createChannelConvex,
    onSuccess: (newChannel) => {
      // Optimistically add to cache
      queryClient.setQueryData(CHANNELS_QUERY_KEY, (old: any[]) => {
        return old ? [...old, newChannel] : [newChannel];
      });
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
    },
  });
}

// ==================== MESSAGES ====================

export function useMessages(channelId: string) {
  const convexMessages = useConvexQuery(
    api.messages.getMessages,
    channelId ? { channelId } : 'skip'
  );
  
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (convexMessages) return convexMessages;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!channelId,
    placeholderData: convexMessages,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const sendMessageConvex = useConvexMutation(api.messages.sendMessage);
  
  return useMutation({
    mutationFn: async ({ channelId, content, authorId }: {
      channelId: string;
      content: string;
      authorId: string;
    }) => {
      return await sendMessageConvex({ channelId, content, authorId });
    },
    onMutate: async ({ channelId, content, authorId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });
      
      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        channelId,
        authorId,
        content,
        isEdited: false,
        isPinned: false,
        reactions: [],
        replies: 0,
        createdAt: Date.now(),
        updatedAt: null,
      };
      
      // Add to cache optimistically
      queryClient.setQueryData(['messages', channelId], (old: any[]) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });
      
      return { optimisticMessage };
    },
    onSuccess: (result, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['messages', variables.channelId], (old: any[]) => {
        return old?.map((msg: any) => 
          msg._id === context?.optimisticMessage._id ? result : msg
        );
      });
    },
    onError: (error, variables, context) => {
      // Remove optimistic message on error
      queryClient.setQueryData(['messages', variables.channelId], (old: any[]) => {
        return old?.filter((msg: any) => msg._id !== context?.optimisticMessage._id);
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['messages', variables.channelId] });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  const addReactionConvex = useConvexMutation(api.messages.addReaction);
  
  return useMutation({
    mutationFn: async ({ messageId, emoji, userId }: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      return await addReactionConvex({
        messageId: messageId as any,
        emoji,
        userId,
      });
    },
    onMutate: async ({ messageId, emoji, userId }) => {
      // Find which channel this message belongs to
      const allMessageQueries = queryClient.getQueriesData({ queryKey: ['messages'] });
      
      for (const [queryKey, messages] of allMessageQueries) {
        const messageList = messages as any[];
        const message = messageList?.find((m: any) => m._id === messageId);
        
        if (message) {
          await queryClient.cancelQueries({ queryKey });
          
          const previousMessages = queryClient.getQueryData(queryKey);
          
          // Update reactions optimistically
          queryClient.setQueryData(queryKey, (old: any[]) => {
            return old?.map((msg: any) => {
              if (msg._id !== messageId) return msg;
              
              const reactions = [...(msg.reactions || [])];
              const existing = reactions.find((r: any) => r.emoji === emoji);
              
              if (existing) {
                if (!existing.users.includes(userId)) {
                  existing.count++;
                  existing.users.push(userId);
                }
              } else {
                reactions.push({ emoji, count: 1, users: [userId] });
              }
              
              return { ...msg, reactions };
            });
          });
          
          return { previousMessages, queryKey };
        }
      }
    },
    onError: (error, variables, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  const editMessageConvex = useConvexMutation(api.messages.editMessage);
  
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      return await editMessageConvex({ messageId: messageId as any, content });
    },
    onMutate: async ({ messageId, content }) => {
      const allMessageQueries = queryClient.getQueriesData({ queryKey: ['messages'] });
      
      for (const [queryKey, messages] of allMessageQueries) {
        const messageList = messages as any[];
        const message = messageList?.find((m: any) => m._id === messageId);
        
        if (message) {
          await queryClient.cancelQueries({ queryKey });
          const previousMessages = queryClient.getQueryData(queryKey);
          
          queryClient.setQueryData(queryKey, (old: any[]) => {
            return old?.map((msg: any) => {
              if (msg._id !== messageId) return msg;
              return { ...msg, content, isEdited: true, updatedAt: Date.now() };
            });
          });
          
          return { previousMessages, queryKey };
        }
      }
    },
    onError: (error, variables, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ==================== ORGANIZATIONS ====================

const ORGS_QUERY_KEY = ['organizations'];

export function useOrganizations() {
  const convexOrgs = useConvexQuery(api.organizations.getOrganizations);
  
  return useQuery({
    queryKey: ORGS_QUERY_KEY,
    queryFn: async () => {
      if (convexOrgs) return convexOrgs;
      throw new Error('Waiting for Convex data...');
    },
    placeholderData: convexOrgs,
    refetchOnWindowFocus: false,
  });
}

export function useOrganization(orgId: string | undefined) {
  const convexOrg = useConvexQuery(
    api.organizations.getOrganization,
    orgId ? { orgId: orgId as any } : 'skip'
  );
  
  return useQuery({
    queryKey: ['organizations', orgId],
    queryFn: async () => {
      if (convexOrg) return convexOrg;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!orgId,
    placeholderData: convexOrg,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const createOrgConvex = useConvexMutation(api.organizations.createOrganization);
  
  return useMutation({
    mutationFn: createOrgConvex,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
    },
  });
}
