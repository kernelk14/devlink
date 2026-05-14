import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation as useConvexMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUIStore } from '../lib/store';

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
        orgId: u.orgId,
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
          orgId: u.orgId,
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

export function useRemoveOrgMember() {
  const queryClient = useQueryClient();
  const removeMemberConvex = useConvexMutation(api.users.removeOrgMember);

  return useMutation({
    mutationFn: ({ adminId, targetUserId, orgId }: { adminId: string, targetUserId: string, orgId: string }) =>
      removeMemberConvex({ adminId: adminId as any, targetUserId: targetUserId as any, orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

export function useChannels(orgId?: string, userId?: string) {
  const convexData = useConvexQuery(
    api.channels.getChannels,
    { orgId, userId }
  );
  const queryClient = useQueryClient();
  const queryKey = ['channels', orgId, userId];

  useLayoutEffect(() => {
    if (convexData === undefined) return;
    queryClient.setQueryData(queryKey, convexData.map((c: any) => ({
      id: c._id,
      _id: c._id,
      name: c.name,
      type: c.type,
      description: c.description,
      members: c.members || [],
      unread: c.unread || [],
      unreadCount: c.unreadCount || 0,
      pinnedCount: c.pinnedCount || 0,
      lastActivity: c.lastActivity,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      orgId: c.orgId,
    })));
  }, [convexData, orgId, userId]);

  return useQuery({
    queryKey,
    queryFn: () => [],
    staleTime: Infinity,
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
  const createChannelConvex = useConvexMutation(api.channels.createChannel);

  return useMutation({
    mutationFn: createChannelConvex as unknown as (variables: {
      name: string;
      type: 'public' | 'private' | 'announcement';
      description?: string;
      orgId: string;
      createdBy: string;
    }) => Promise<any>,
  });
}

export function useJoinChannel() {
  const joinChannelConvex = useConvexMutation(api.channels.joinChannel);

  return useMutation({
    mutationFn: ({ channelId, userId }: { channelId: string; userId: string }) =>
      joinChannelConvex({ channelId: channelId as any, userId: userId as any }),
  });
}

export function useMarkChannelRead() {
  const updateChannelConvex = useConvexMutation(api.channels.updateChannel);
  const currentUserId = useUIStore((s) => s.currentUserId);

  return useMutation({
    mutationFn: async ({ channelId }: { channelId: string }) => {
      return await updateChannelConvex({ channelId: channelId as any, userId: currentUserId || undefined });
    },
  });
}

// ==================== MESSAGES ====================

export function useMessages(channelId?: string) {
  const convexData = useConvexQuery(
    api.messages.getMessages,
    channelId ? { channelId } : 'skip'
  );
  const queryClient = useQueryClient();
  const queryKey = ['messages', channelId];

  useLayoutEffect(() => {
    if (convexData === undefined) return;
    queryClient.setQueryData(queryKey, convexData.map((m: any) => ({
      id: m._id, _id: m._id, ...m,
    })));
  }, [convexData, channelId]);

  return useQuery({
    queryKey,
    queryFn: () => [],
    staleTime: Infinity,
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
  });
}

export function useAddReaction() {
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
  });
}

export function useEditMessage() {
  const editMessageConvex = useConvexMutation(api.messages.editMessage);

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      return await editMessageConvex({ messageId: messageId as any, content });
    },
  });
}

export function useDeleteMessage() {
  const deleteMessageConvex = useConvexMutation(api.messages.deleteMessage);

  return useMutation({
    mutationFn: (messageId: string) => deleteMessageConvex({ messageId: messageId as any }),
  });
}

export function usePinMessage() {
  const pinMessageConvex = useConvexMutation(api.messages.pinMessage);

  return useMutation({
    mutationFn: (messageId: string) => pinMessageConvex({ messageId: messageId as any }),
  });
}

export function useUnpinMessage() {
  const unpinMessageConvex = useConvexMutation(api.messages.unpinMessage);

  return useMutation({
    mutationFn: (messageId: string) => unpinMessageConvex({ messageId: messageId as any }),
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

export function useOrganizationByCode(code: string | undefined) {
  const convexOrg = useConvexQuery(
    api.organizations.getOrganizationByCode,
    code ? { code } : 'skip'
  );

  return useQuery({
    queryKey: ['organizations', 'code', code],
    queryFn: async () => {
      if (convexOrg) return convexOrg;
      throw new Error('Waiting for Convex data...');
    },
    enabled: !!code,
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
      code: string;
      visibility?: 'public' | 'private';
      avatar?: string;
      description?: string;
      website?: string;
      tags?: string[];
      creatorId?: string;
    }) => Promise<string>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const updateOrgConvex = useConvexMutation(api.organizations.updateOrganization);

  return useMutation({
    mutationFn: updateOrgConvex as unknown as (variables: {
      orgId: string;
      name?: string;
      slug?: string;
      code?: string;
      visibility?: 'public' | 'private';
      avatar?: string;
      description?: string;
      website?: string;
      tags?: string[];
    }) => Promise<any>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
    },
  });
}

// ==================== AUTH ====================

export function useRegister() {
  const registerAction = useAction(api.auth.register);

  return useMutation({
    mutationFn: async ({ name, username, email, password }: { name: string; username: string; email: string; password: string }) => {
      return await registerAction({ name, username, email, password });
    },
  });
}

export function useLogin() {
  const loginAction = useAction(api.auth.login);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await loginAction({ email, password });
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
  const convexData = useConvexQuery(
    api.dms.getMyDMs,
    userId && orgId ? { userId, orgId } : 'skip'
  );
  const queryClient = useQueryClient();
  const queryKey = ['dms', userId, orgId];

  useLayoutEffect(() => {
    if (convexData === undefined) return;
    queryClient.setQueryData(queryKey, convexData);
  }, [convexData, userId, orgId]);

  return useQuery({
    queryKey,
    queryFn: () => [],
    staleTime: Infinity,
    enabled: !!userId && !!orgId,
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ['dms'] });
    },
  });
}

export function useMarkDMRead() {
  const markReadConvex = useConvexMutation(api.dms.markDMRead);

  return useMutation({
    mutationFn: ({ dmId, userId }: { dmId: string, userId: string }) =>
      markReadConvex({ dmId: dmId as any, userId }),
  });
}