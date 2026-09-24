import { create } from 'zustand';
import {
  getConversations,
  getConversationMessages,
  sendChatMessage,
  SendMessagePayload,
} from '../api/chatApi';
import { getSocket } from '../utils/socket';
import { useAuthStore } from './authStore';

export interface Conversation {
  id: number;
  type: 'direct' | 'group' | string;
  title: string;
  displayTitle?: string;
  description?: string | null;
  is_announcement?: boolean | number;
  is_master?: boolean | number;
  is_activity?: boolean | number;
  who_can_post?: 'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'ADMIN_ONLY' | string;
  created_by?: number;
  last_message?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  created_at?: string;
  unread_count?: number;
  member_role?: 'ADMIN' | 'MEMBER' | string;
  can_post?: boolean | number;
  partnerId?: number | null;
  department_name?: string | null;
  department_id?: number | null;
  other_user_name?: string | null;
  other_user_email?: string | null;
  other_user_mobile?: string | null;
}

export interface Attachment {
  id: number;
  message_id: number;
  original_name: string;
  stored_name: string;
  file_size: number;
  mime_type: string;
  storage_provider?: string;
  cloud_key?: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  sender_username?: string;
  message_text: string;
  parent_message_id?: number | null;
  parent_message_text?: string | null;
  parent_sender_name?: string | null;
  created_at: string;
  attachments?: Attachment[];
  attachment_id?: number | null;
  original_name?: string | null;
  stored_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
}

export interface TypingUser {
  conversationId: number;
  userId: number;
  userName: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  onlineUserIds: string[];
  typingUsers: TypingUser[];

  loadConversations: (selectFirstIfEmpty?: boolean) => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  leaveActiveConversation: () => void;
  loadMessages: (conversationId: number) => Promise<void>;
  sendMessage: (payload: Omit<SendMessagePayload, 'conversationId'>) => Promise<boolean>;
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
}

const sortConversations = (list: Conversation[]): Conversation[] => {
  return [...list].sort((a, b) => {
    // #activity channel pinned first
    const aIsActivity = Boolean(a.is_activity) || a.title === '#activity';
    const bIsActivity = Boolean(b.is_activity) || b.title === '#activity';
    if (aIsActivity) return -1;
    if (bIsActivity) return 1;

    // Master announcements pinned second
    if (a.is_master && !b.is_master) return -1;
    if (!a.is_master && b.is_master) return 1;

    // Sort by latest message/activity timestamp
    const aTime = new Date(a.last_message_at || a.created_at || 0).getTime();
    const bTime = new Date(b.last_message_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  onlineUserIds: [],
  typingUsers: [],

  loadConversations: async (selectFirstIfEmpty = false) => {
    try {
      set({ isLoadingConversations: true });
      const res = await getConversations();
      const list = res?.conversations || res?.data || (Array.isArray(res) ? res : []);
      const validList: Conversation[] = Array.isArray(list) ? list : [];
      const sorted = sortConversations(validList);

      set({
        conversations: sorted,
        isLoadingConversations: false,
      });

      if (selectFirstIfEmpty && sorted.length > 0 && !get().activeConversation) {
        const activity = sorted.find((c) => Boolean(c.is_activity) || c.title === '#activity');
        if (activity) {
          get().selectConversation(activity);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (conv: Conversation) => {
    const prevActive = get().activeConversation;
    const socket = getSocket();

    if (prevActive && prevActive.id !== conv.id) {
      socket.emit('conversation:leave', prevActive.id);
    }

    set({
      activeConversation: conv,
      messages: [],
      // Clear unread count locally for this conversation
      conversations: get().conversations.map((c) =>
        c.id === conv.id ? { ...c, unread_count: 0 } : c
      ),
    });

    socket.emit('conversation:join', conv.id);
    await get().loadMessages(conv.id);
  },

  leaveActiveConversation: () => {
    const active = get().activeConversation;
    if (active) {
      const socket = getSocket();
      socket.emit('conversation:leave', active.id);
      set({ activeConversation: null, messages: [] });
    }
  },

  loadMessages: async (conversationId: number) => {
    try {
      set({ isLoadingMessages: true });
      const res = await getConversationMessages(conversationId);
      const list = res?.messages || res?.data || (Array.isArray(res) ? res : []);
      const validMessages = Array.isArray(list) ? list : [];

      set({
        messages: validMessages,
        isLoadingMessages: false,
      });
    } catch (err) {
      console.error('Failed to load messages for conversation:', conversationId, err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (partialPayload) => {
    const active = get().activeConversation;
    if (!active) return false;

    try {
      get().emitTypingStop();
      await sendChatMessage({
        conversationId: active.id,
        ...partialPayload,
      });
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
    }
  },

  emitTypingStart: () => {
    const active = get().activeConversation;
    const user = useAuthStore.getState().user;
    if (!active || !user) return;

    const socket = getSocket();
    socket.emit('typing:start', {
      conversationId: active.id,
      userId: user.id,
      userName: user.name || user.username || 'Teammate',
    });
  },

  emitTypingStop: () => {
    const active = get().activeConversation;
    const user = useAuthStore.getState().user;
    if (!active || !user) return;

    const socket = getSocket();
    socket.emit('typing:stop', {
      conversationId: active.id,
      userId: user.id,
      userName: user.name || user.username,
    });
  },

  setupSocketListeners: () => {
    const socket = getSocket();
    const user = useAuthStore.getState().user;

    if (user?.id) {
      socket.emit('user:online', user.id);
    }

    socket.off('users:online');
    socket.on('users:online', (ids: string[]) => {
      set({ onlineUserIds: ids || [] });
    });

    socket.off('message:new');
    socket.on('message:new', (newMsg: ChatMessage) => {
      const active = get().activeConversation;

      // If this message belongs to the open chat, append it
      if (active && Number(active.id) === Number(newMsg.conversation_id)) {
        set((state) => {
          if (state.messages.some((m) => m.id === newMsg.id)) {
            return state;
          }
          return { messages: [...state.messages, newMsg] };
        });
      }

      // Update snippet in conversation list
      set((state) => {
        const convExists = state.conversations.some(
          (c) => Number(c.id) === Number(newMsg.conversation_id)
        );

        if (!convExists) {
          get().loadConversations(false);
          return state;
        }

        const updated = state.conversations.map((c) => {
          if (Number(c.id) === Number(newMsg.conversation_id)) {
            const isCurrentChat = active && Number(active.id) === Number(c.id);
            return {
              ...c,
              last_message:
                newMsg.message_text ||
                (newMsg.original_name ? `📎 ${newMsg.original_name}` : 'Message'),
              last_message_at: newMsg.created_at,
              unread_count: isCurrentChat ? 0 : (c.unread_count || 0) + 1,
            };
          }
          return c;
        });

        return { conversations: sortConversations(updated) };
      });
    });

    socket.off('conversation:new');
    socket.on('conversation:new', () => {
      get().loadConversations(false);
    });

    socket.off('conversation:updated');
    socket.on('conversation:updated', () => {
      get().loadConversations(false);
    });

    socket.off('conversation:deleted');
    socket.on('conversation:deleted', ({ conversationId }: { conversationId: number }) => {
      set((state) => {
        const filtered = state.conversations.filter(
          (c) => Number(c.id) !== Number(conversationId)
        );
        const isActive = state.activeConversation && Number(state.activeConversation.id) === Number(conversationId);
        return {
          conversations: filtered,
          activeConversation: isActive ? null : state.activeConversation,
          messages: isActive ? [] : state.messages,
        };
      });
    });

    socket.off('typing:start');
    socket.on('typing:start', ({ conversationId, userId, userName }: TypingUser) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (Number(userId) === Number(currentUserId)) return;

      set((state) => {
        if (state.typingUsers.some((t) => t.userId === userId && t.conversationId === conversationId)) {
          return state;
        }
        return { typingUsers: [...state.typingUsers, { conversationId, userId, userName }] };
      });
    });

    socket.off('typing:stop');
    socket.on('typing:stop', ({ conversationId, userId }: { conversationId: number; userId: number }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter(
          (t) => !(t.userId === userId && t.conversationId === conversationId)
        ),
      }));
    });
  },

  cleanupSocketListeners: () => {
    const socket = getSocket();
    socket.off('users:online');
    socket.off('message:new');
    socket.off('conversation:new');
    socket.off('conversation:updated');
    socket.off('conversation:deleted');
    socket.off('typing:start');
    socket.off('typing:stop');
  },
}));
