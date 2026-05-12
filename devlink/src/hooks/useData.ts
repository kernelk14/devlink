import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// ==================== USERS ====================

const USERS_QUERY_KEY = ['users'];

export function useUsers() {
  const queryClient = useQueryClient();

  // Use Convex real-time query
  const convexUsers = useConvexQuery(api.users.getUsers);

  // Sync Convex real-time data into TanStack Query cache, mapped to consistent format
  useEffect(() => {
    if (convexUsers !== undefined) {
      const mapped = convexUsers.map((u: any) => ({
        id: u._id,
        _id: u._id,
        name: u.name,
        email: u.email,
        username: u.username,
        avatar: u.avatar,
        status: u.status,
        statusMessage: u.statusMessage,
        color: u.color,
        contacts: u.contacts || [],
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      queryClient.setQueryData(USERS_QUERY_KEY, mapped);
    }
  }, [convexUsers]);

  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      if (convexUsers) {
        return convexUsers.map((u: any) => ({
          id: u._id,
          _id: u._id,
          name: u.name,
          email: u.email,
          username: u.username,
          avatar: u.avatar,
          status: u.status,
          statusMessage: u.statusMessage,
          color: u.color,
          contacts: u.contacts || [],
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));
      }
      throw new Error('Waiting for Convex data...');
    },
    refetchOnWindowFocus: false,
    placeholderData: convexUsers
      ? convexUsers.map((u: any) => ({
          id: u._id,
          _id: u._id,
          name: u.name,
          email: u.email,
          username: u.username,
          avatar: u.avatar,
          status: u.status,
          statusMessage: u.statusMessage,
          color: u.color,
          contacts: u.contacts || [],
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }))
      : undefined,
  });
}

export function useUser(userId: string | undefined) {
  const convexUser = useConvexQuery(
    api.users.getUser,
    userId ? { userId: userId as any } : 'skip'
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (convexUser !== undefined && convexUser !== null) {
      queryClient.setQueryData(['users', userId], convexUser);
      queryClient.setQueryData(['user', userId], {
        id: convexUser._id,
        ...convexUser,
      });
    }
  }, [convexUser, userId]);

  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (convexUser) return convexUser;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!userId,
    placeholderData: convexUser ?? undefined,
    refetchOnWindowFocus: false,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const createUserConvex = useConvexMutation(api.users.createUser);

  return useMutation({
    mutationFn: createUserConvex as unknown as (variables: {
      name: string;
      username: string;
      email: string;
      avatar?: string;
      orgId?: string;
    }) => Promise<string | undefined>,
    onSuccess: () => {
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
      await queryClient.cancelQueries({ queryKey: ['users', userId] });

      const previousUser = queryClient.getQueryData(['users', userId]);

      queryClient.setQueryData(['users', userId], (old: any) => ({
        ...old,
        status,
        statusMessage,
        updatedAt: Date.now(),
      }));

      return { previousUser };
    },
    onError: (err, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['users', variables.userId], context.previousUser);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const updateUserConvex = useConvexMutation(api.users.updateUser);

  return useMutation({
    mutationFn: async ({ userId, name, username, avatar, color, orgId, role, is_new_user }: {
      userId: string;
      name?: string;
      username?: string;
      avatar?: string;
      color?: string;
      orgId?: string;
      role?: string;
      is_new_user?: boolean;
    }) => {
      return await updateUserConvex({
        userId: userId as any,
        name,
        username,
        avatar,
        color,
        orgId,
        role: role as any,
        is_new_user,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useConnectUser() {
  const queryClient = useQueryClient();
  const sendRequestConvex = useConvexMutation(api.connections.sendRequest);

  return useMutation({
    mutationFn: ({ senderId, receiverId }: { senderId: string, receiverId: string }) =>
      sendRequestConvex({ senderId: senderId as any, receiverId: receiverId as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
  });
}

export function usePendingRequests(userId: string | undefined) {
  const convexRequests = useConvexQuery(
    api.connections.getPendingRequests,
    userId ? { userId: userId as any } : 'skip'
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (convexRequests !== undefined) {
      queryClient.setQueryData(['connection-requests', userId], convexRequests);
    }
  }, [convexRequests, userId]);

  return useQuery({
    queryKey: ['connection-requests', userId],
    queryFn: async () => {
      if (convexRequests) return convexRequests;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  const acceptRequestConvex = useConvexMutation(api.connections.acceptRequest);

  return useMutation({
    mutationFn: (requestId: string) => acceptRequestConvex({ requestId: requestId as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  const rejectRequestConvex = useConvexMutation(api.connections.rejectRequest);

  return useMutation({
    mutationFn: (requestId: string) => rejectRequestConvex({ requestId: requestId as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
  });
}

// ==================== CHANNELS ====================

const CHANNELS_QUERY_KEY = ['channels'];

export function useChannels(orgId?: string, userId?: string) {
  const convexChannels = useConvexQuery(
    api.channels.getChannels,
    { orgId, userId }
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (convexChannels !== undefined) {
      const mapped = convexChannels.map((c: any) => ({
        id: c._id,
        _id: c._id,
        name: c.name,
        type: c.type,
        description: c.description,
        members: c.members || [],
        unreadCount: c.unreadCount || 0,
        pinnedCount: c.pinnedCount || 0,
        lastActivity: c.lastActivity,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        orgId: c.orgId,
      }));
      queryClient.setQueryData([CHANNELS_QUERY_KEY, orgId, userId], mapped);
    }
  }, [convexChannels, orgId, userId]);

  return useQuery({
    queryKey: [CHANNELS_QUERY_KEY, orgId, userId],
    queryFn: async () => {
      if (convexChannels) {
        return convexChannels.map((c: any) => ({
          id: c._id,
          _id: c._id,
          name: c.name,
          type: c.type,
          description: c.description,
          members: c.members || [],
          unreadCount: c.unreadCount || 0,
          pinnedCount: c.pinnedCount || 0,
          lastActivity: c.lastActivity,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          orgId: c.orgId,
        }));
      }
      throw new Error('Waiting for Convex data...');
    },
    placeholderData: convexChannels
      ? convexChannels.map((c: any) => ({
          id: c._id,
          _id: c._id,
          name: c.name,
          type: c.type,
          description: c.description,
          members: c.members || [],
          unreadCount: c.unreadCount || 0,
          pinnedCount: c.pinnedCount || 0,
          lastActivity: c.lastActivity,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          orgId: c.orgId,
        }))
      : undefined,
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
      if (convexChannel) {
        const { _id, ...rest } = convexChannel;
        return {
          id: _id,
          _id,
          ...rest,
        };
      }
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!channelId,
    placeholderData: convexChannel
      ? (() => {
          const { _id, ...rest } = convexChannel;
          return {
            id: _id,
            _id,
            ...rest,
          };
        })()
      : undefined,
    refetchOnWindowFocus: false,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  const createChannelConvex = useConvexMutation(api.channels.createChannel);

  return useMutation({
    mutationFn: createChannelConvex as unknown as (variables: {
      name: string;
      type: 'public' | 'private' | 'announcement';
      description?: string;
      orgId: string;
      createdBy: string;
    }) => Promise<any>,
    onSuccess: (newChannel) => {
      const mapped = {
        id: newChannel._id,
        _id: newChannel._id,
        ...newChannel,
      };
      queryClient.setQueryData(CHANNELS_QUERY_KEY, (old: any[]) => {
        return old ? [...old, mapped] : [mapped];
      });
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();
  const joinChannelConvex = useConvexMutation(api.channels.joinChannel);

  return useMutation({
    mutationFn: ({ channelId, userId }: { channelId: string; userId: string }) =>
      joinChannelConvex({ channelId: channelId as any, userId: userId as any }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['channels', variables.channelId] });
    },
  });
}

// ==================== MESSAGES ====================

export function useMessages(channelId?: string) {
  const convexMessages = useConvexQuery(
    api.messages.getMessages,
    channelId ? { channelId } : 'skip'
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (convexMessages !== undefined) {
      const mapped = convexMessages.map((m: any) => ({
        id: m._id,
        _id: m._id,
        ...m,
      }));
      queryClient.setQueryData(['messages', channelId], mapped);
    }
  }, [convexMessages, channelId]);

  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (convexMessages) {
        return convexMessages.map((m: any) => ({
          id: m._id,
          _id: m._id,
          ...m,
        }));
      }
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!channelId,
    refetchOnWindowFocus: false,
  });
}

export function useThreadReplies(parentMessageId: string | null) {
  return useConvexQuery(
    api.threads.getThreadReplies,
    parentMessageId ? { parentMessageId } : 'skip'
  );
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const sendMessageConvex = useConvexMutation(api.messages.sendMessage);

  return useMutation({
    mutationFn: async ({ channelId, content, authorId, threadId }: {
      channelId: string;
      content: string;
      authorId: string;
      threadId?: string;
    }) => {
      return await sendMessageConvex({ channelId, content, authorId, threadId });
    },
    onMutate: async ({ channelId, content, authorId, threadId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        _id: `temp-${Date.now()}`,
        channelId,
        authorId,
        content,
        isEdited: false,
        isPinned: false,
        reactions: [] as any[],
        replies: 0,
        threadId,
        createdAt: Date.now(),
        updatedAt: null,
      };

      queryClient.setQueryData(['messages', channelId], (old: any[]) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { optimisticMessage };
    },
    onSuccess: (result, variables, context) => {
      if (!result) return;
      const { _id, ...rest } = result;
      const mapped = {
        id: _id,
        _id,
        ...rest,
      };
      queryClient.setQueryData(['messages', variables.channelId], (old: any[]) => {
        return old?.map((msg: any) =>
          msg._id === context?.optimisticMessage._id ? mapped : msg
        );
      });
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['messages', variables.channelId], (old: any[]) => {
        return old?.filter((msg: any) => msg._id !== context?.optimisticMessage._id);
      });
    },
    onSettled: (data, error, variables) => {
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

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const deleteMessageConvex = useConvexMutation(api.messages.deleteMessage);

  return useMutation({
    mutationFn: (messageId: string) => deleteMessageConvex({ messageId: messageId as any }),
    onSuccess: (_result, messageId) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function usePinMessage() {
  const queryClient = useQueryClient();
  const pinMessageConvex = useConvexMutation(api.messages.pinMessage);

  return useMutation({
    mutationFn: (messageId: string) => pinMessageConvex({ messageId: messageId as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUnpinMessage() {
  const queryClient = useQueryClient();
  const unpinMessageConvex = useConvexMutation(api.messages.unpinMessage);

  return useMutation({
    mutationFn: (messageId: string) => unpinMessageConvex({ messageId: messageId as any }),
    onSuccess: () => {
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
    placeholderData: convexOrg ?? undefined,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const createOrgConvex = useConvexMutation(api.organizations.createOrganization);

  return useMutation({
    mutationFn: createOrgConvex as unknown as (variables: {
      name: string;
      slug: string;
      avatar?: string;
      creatorId?: string;
    }) => Promise<string>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
    },
  });
}

// ==================== DIRECT MESSAGES ====================

export function useOrCreateDM() {
  const queryClient = useQueryClient();
  const getOrCreateDMConvex = useConvexMutation(api.dms.getOrCreateDM);

  return useMutation({
    mutationFn: ({ user1Id, user2Id, orgId }: { user1Id: string; user2Id: string; orgId: string }) =>
      getOrCreateDMConvex({ user1Id, user2Id, orgId }) as Promise<string>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms'] });
    },
  });
}

export function useMyDMs(userId: string | undefined, orgId: string | undefined) {
  const convexDMs = useConvexQuery(
    api.dms.getMyDMs,
    userId && orgId ? { userId, orgId } : 'skip'
  );

  return useQuery({
    queryKey: ['dms', userId, orgId],
    queryFn: async () => {
      if (convexDMs) return convexDMs;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!userId && !!orgId,
  });
}

export function useDM(dmId: string | undefined) {
  const convexDM = useConvexQuery(
    api.dms.getDM,
    dmId ? { dmId: dmId as any } : 'skip'
  );

  return useQuery({
    queryKey: ['dm', dmId],
    queryFn: async () => {
      if (convexDM) return convexDM;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!dmId,
  });
}

export function useSendDM() {
  const queryClient = useQueryClient();
  const sendMessageConvex = useConvexMutation(api.messages.sendMessage);

  return useMutation({
    mutationFn: async ({ dmId, content, authorId }: {
      dmId: string;
      content: string;
      authorId: string;
    }) => {
      return await sendMessageConvex({ channelId: dmId, content, authorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}