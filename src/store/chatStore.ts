import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import {
  getConversations,
  getConversationMessages,
  sendChatMessage,
  getOnlineUsers,
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
  company_name?: string | null;
  company_id?: number | null;
  is_company_group?: boolean | number;
  is_company_broadcast?: boolean | number;
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
  attachmentId?: number;
  file_name?: string;
  file_type?: string;
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
  attachmentId?: number | null;
  original_name?: string | null;
  file_name?: string | null;
  stored_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  file_type?: string | null;
  message_type?: string;
  is_attachment_restricted?: boolean;
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
  fetchOnlineUsers: () => Promise<void>;
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
}

/** Return a user-friendly snippet label for an attachment based on mime type or file name */
const getAttachmentLabel = (mimeType?: string, fileName?: string): string => {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(name)) return '📷 Image';
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return '🎥 Video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a)$/.test(name)) return '🎵 Audio';
  return '📄 Document';
};

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

let presenceInterval: any = null;
let appStateSubscription: any = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: true,
  isLoadingMessages: false,
  onlineUserIds: [],
  typingUsers: [],

  fetchOnlineUsers: async () => {
    try {
      const res = await getOnlineUsers();
      if (res?.onlineUserIds && Array.isArray(res.onlineUserIds)) {
        set({ onlineUserIds: res.onlineUserIds.map((id: any) => String(id)) });
      }
    } catch (_) {}
  },

  loadConversations: async (selectFirstIfEmpty = false) => {
    try {
      // Refresh online users in background whenever conversations load
      get().fetchOnlineUsers();
      set({ isLoadingConversations: true });
      const res = await getConversations();
      const list = res?.conversations || res?.data || (Array.isArray(res) ? res : []);
      const rawList: Conversation[] = Array.isArray(list) ? list : [];
      const validList = rawList.map((c: any) => {
        let lastMsg = (c.last_message || c.last_message_text || '').trim();
        const attName = c.original_name || c.file_name || c.attachment_name;
        if (!lastMsg && attName) {
          lastMsg = getAttachmentLabel(c.mime_type || c.file_type, attName);
        }
        return {
          ...c,
          partnerId: c.partnerId || c.other_user_id || c.partner_id || null,
          last_message: lastMsg || null,
        };
      });
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
      console.warn('Failed to load conversations:', err);
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

      const augmentedMessages = validMessages.map((msg: any) => {
        const pId = msg.parent_message_id || msg.parentMessageId;
        const pText = msg.reply_to_text || msg.parent_message_text;
        if (pId && !pText) {
          const parent = validMessages.find((m: any) => Number(m.id) === Number(pId));
          if (parent) {
            return {
              ...msg,
              parent_message_id: pId,
              parent_message_text: parent.message_text || (parent.original_name ? `📎 ${parent.original_name}` : ''),
              parent_sender_name: parent.sender_name || parent.sender_username,
            };
          }
        }
        return {
          ...msg,
          parent_message_id: pId || null,
          parent_message_text: pText || null,
        };
      });

      set({
        messages: augmentedMessages,
        isLoadingMessages: false,
      });
    } catch (err) {
      console.warn('Failed to load messages for conversation:', conversationId, err);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (partialPayload) => {
    const active = get().activeConversation;
    if (!active) return false;
    const user = useAuthStore.getState().user;

    try {
      get().emitTypingStop();
      const res = await sendChatMessage({
        conversationId: active.id,
        ...partialPayload,
      });

      const rawMsg = res?.data || res?.message || res;
      if (rawMsg && (rawMsg.id || rawMsg.content || rawMsg.message_text)) {
        const parentMsg = partialPayload.parentMessageId 
          ? get().messages.find(m => m.id === partialPayload.parentMessageId) 
          : null;
        
        const normalized: ChatMessage = {
          ...rawMsg,
          id: rawMsg.id || Date.now(),
          conversation_id: Number(rawMsg.conversation_id || rawMsg.conversationId || active.id),
          sender_id: Number(rawMsg.sender_id || rawMsg.senderId || user?.id || 0),
          sender_name: rawMsg.sender_name || user?.name || user?.username,
          sender_username: rawMsg.sender_username || user?.username,
          message_text: rawMsg.message_text || rawMsg.content || partialPayload.messageText || '',
          created_at: rawMsg.created_at || new Date().toISOString(),
          attachments: rawMsg.attachments || [],
          parent_message_id: rawMsg.parent_message_id || partialPayload.parentMessageId || null,
          parent_message_text: rawMsg.reply_to_text || rawMsg.parent_message_text || parentMsg?.message_text || null,
          parent_sender_name: rawMsg.parent_sender_name || parentMsg?.sender_name || parentMsg?.sender_username || null,
        };

        set((state) => {
          const exists = state.messages.some((m) => m.id === normalized.id);
          const newMessages = exists ? state.messages : [...state.messages, normalized];

          const updatedConversations = state.conversations.map((c) => {
            if (Number(c.id) === Number(active.id)) {
              return {
                ...c,
                last_message:
                  normalized.message_text ||
                  (normalized.original_name
                    ? getAttachmentLabel(
                        normalized.attachments?.[0]?.mime_type,
                        normalized.original_name
                      )
                    : 'Message'),
                last_message_at: normalized.created_at,
              };
            }
            return c;
          });

          return {
            messages: newMessages,
            conversations: sortConversations(updatedConversations),
          };
        });
      } else {
        // Fallback: reload messages from server
        await get().loadMessages(active.id);
      }

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
    const user = useAuthStore.getState().user;
    const socket = getSocket(user?.id);

    // Initial fetch of online users via HTTP
    get().fetchOnlineUsers();

    const handleConnect = () => {
      const u = useAuthStore.getState().user;
      if (u?.id) {
        socket.emit('user:online', String(u.id));
      }
      // Request current online list immediately after connecting
      socket.emit('users:get_online');
      get().fetchOnlineUsers();
      const act = get().activeConversation;
      if (act?.id) {
        socket.emit('conversation:join', act.id);
      }
    };

    socket.off('connect', handleConnect);
    socket.on('connect', handleConnect);

    if (user?.id) {
      socket.emit('user:online', String(user.id));
    }
    // Request current online list on setup
    socket.emit('users:get_online');

    // Periodic presence ping every 5 seconds (matching web frontend ChatApp.jsx)
    if (presenceInterval) {
      clearInterval(presenceInterval);
    }
    presenceInterval = setInterval(async () => {
      const u = useAuthStore.getState().user;
      const sock = getSocket(u?.id);
      if (u?.id && sock.connected) {
        sock.emit('user:online', String(u.id));
      }
      if (sock.connected) {
        sock.emit('users:get_online');
      }
      await get().fetchOnlineUsers();
    }, 5000);

    // Sync presence when app returns to foreground
    if (appStateSubscription) {
      appStateSubscription.remove();
    }
    appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const u = useAuthStore.getState().user;
        const sock = getSocket(u?.id);
        if (u?.id && sock.connected) {
          sock.emit('user:online', String(u.id));
        }
        if (sock.connected) {
          sock.emit('users:get_online');
        }
        get().fetchOnlineUsers();
        get().loadConversations(false);
      }
    });

    socket.off('users:online');
    socket.on('users:online', (ids: string[]) => {
      // Normalize all IDs to strings to avoid type mismatch
      set({ onlineUserIds: (ids || []).map((id) => String(id)) });
    });

    socket.off('message:new');
    socket.on('message:new', (newMsg: any) => {
      if (!newMsg) return;
      const active = get().activeConversation;
      const msgConvId = Number(newMsg.conversation_id || newMsg.conversationId);

      // Extract attachment information from all possible payload shapes
      const rawAtt = Array.isArray(newMsg.attachments) && newMsg.attachments.length > 0
        ? newMsg.attachments[0]
        : null;
      const attId = rawAtt?.id || rawAtt?.attachmentId || newMsg.attachmentId || newMsg.attachment_id || (newMsg.message_type === 'FILE' || newMsg.message_type === 'IMAGE' || newMsg.message_type === 'VIDEO' ? newMsg.id : undefined);
      const attName = rawAtt?.original_name || rawAtt?.file_name || newMsg.file_name || newMsg.original_name || (newMsg.message_type === 'FILE' ? 'Document' : '');
      const attMime = rawAtt?.mime_type || rawAtt?.file_type || newMsg.file_type || newMsg.mime_type || '';
      const attSize = rawAtt?.file_size || newMsg.file_size || 0;

      const hasAttachment = Boolean(
        attName ||
        attId ||
        newMsg.message_type === 'FILE' ||
        newMsg.message_type === 'IMAGE' ||
        newMsg.message_type === 'VIDEO'
      );

      const normalizedAttachments = rawAtt
        ? [{
            ...rawAtt,
            id: rawAtt.id || attId || newMsg.id,
            original_name: rawAtt.original_name || attName || 'Document',
            mime_type: rawAtt.mime_type || attMime || '',
            file_size: rawAtt.file_size || attSize || 0,
          }]
        : hasAttachment
        ? [{
            id: attId || newMsg.id,
            message_id: Number(newMsg.id),
            original_name: attName || 'Document',
            stored_name: newMsg.stored_name || '',
            file_size: attSize,
            mime_type: attMime,
          }]
        : [];

      let pText = newMsg.reply_to_text || newMsg.parent_message_text;
      let pSender = newMsg.parent_sender_name;
      const pId = newMsg.parent_message_id || newMsg.parentMessageId;
      if (pId && !pText) {
        const pMsg = get().messages.find((m) => Number(m.id) === Number(pId));
        if (pMsg) {
          pText = pMsg.message_text || (pMsg.original_name ? `📎 ${pMsg.original_name}` : '');
          pSender = pMsg.sender_name || pMsg.sender_username;
        }
      }

      const normalizedMsg: ChatMessage = {
        ...newMsg,
        id: Number(newMsg.id),
        conversation_id: msgConvId,
        message_text: newMsg.message_text || newMsg.content || '',
        attachments: normalizedAttachments,
        attachment_id: attId ? Number(attId) : undefined,
        attachmentId: attId ? Number(attId) : undefined,
        original_name: attName || (normalizedAttachments[0]?.original_name) || null,
        file_name: attName || (normalizedAttachments[0]?.original_name) || null,
        mime_type: attMime || (normalizedAttachments[0]?.mime_type) || null,
        file_type: attMime || (normalizedAttachments[0]?.mime_type) || null,
        file_size: attSize || (normalizedAttachments[0]?.file_size) || null,
        parent_message_id: pId || null,
        parent_message_text: pText,
        parent_sender_name: pSender,
      };

      // If this message belongs to the open chat, append or update it immediately
      if (active && Number(active.id) === msgConvId) {
        set((state) => {
          const exists = state.messages.some((m) => Number(m.id) === Number(normalizedMsg.id));
          if (exists) {
            return {
              messages: state.messages.map((m) =>
                Number(m.id) === Number(normalizedMsg.id) ? { ...m, ...normalizedMsg } : m
              ),
            };
          }
          return { messages: [...state.messages, normalizedMsg] };
        });

        // Background sync to ensure full joined database state
        get().loadMessages(msgConvId);
      }

      // Update snippet in conversation list
      set((state) => {
        const convExists = state.conversations.some(
          (c) => Number(c.id) === msgConvId
        );

        if (!convExists) {
          get().loadConversations(false);
          return state;
        }

        const snippetName = attName || normalizedMsg.original_name || newMsg.original_name || newMsg.file_name;
        const snippetMime = normalizedMsg.attachments?.[0]?.mime_type || newMsg.mime_type || newMsg.file_type || '';
        const updated = state.conversations.map((c) => {
          if (Number(c.id) === msgConvId) {
            const isCurrentChat = active && Number(active.id) === Number(c.id);
            return {
              ...c,
              last_message:
                normalizedMsg.message_text ||
                (snippetName ? getAttachmentLabel(snippetMime, snippetName) : 'Message'),
              last_message_at: normalizedMsg.created_at || new Date().toISOString(),
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

    socket.off('message:deleted');
    socket.on('message:deleted', ({ messageId }: { messageId: number; conversationId?: number }) => {
      set((state) => ({
        messages: state.messages.filter((m) => Number(m.id) !== Number(messageId)),
      }));
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
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    const socket = getSocket();
    socket.off('users:online');
    socket.off('message:new');
    socket.off('message:deleted');
    socket.off('conversation:new');
    socket.off('conversation:updated');
    socket.off('conversation:deleted');
    socket.off('typing:start');
    socket.off('typing:stop');
  },
}));
