import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  TouchableOpacity,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppAvatar } from '../../components/common/AppAvatar';
import { ArrowLeftIcon, TrashIcon, PhoneIcon, VideoIcon } from '../../components/icons/SvgIcons';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { AttachmentPickerModal } from '../../components/chat/AttachmentPickerModal';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useAuthStore, isUserAdminRole } from '../../store/authStore';
import { uploadChatAttachment, deleteGroupChat, deleteMessage, FileUploadAsset } from '../../api/chatApi';
import { getSocket } from '../../utils/socket';
import { useCall } from '../../context/CallContext';

interface ChatDetailScreenProps {
  navigation: any;
  route: any;
}

export const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({
  navigation,
  route: _route,
}) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const isAdmin = isUserAdminRole(user);
  const { startCall, callStatus, endCall, cleanupCall } = useCall();

  const {
    activeConversation,
    conversations,
    messages,
    sendMessage,
    onlineUserIds,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    leaveActiveConversation,
    loadConversations,
    loadMessages,
    selectConversation,
    setupSocketListeners,
  } = useChatStore();

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileUploadAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const targetConvId = _route?.params?.conversationId || activeConversation?.id;

  // Refresh messages and permissions whenever user enters or returns to this chat screen
  useFocusEffect(
    useCallback(() => {
      useAuthStore.getState().refreshPermissions();
      setupSocketListeners();

      if (targetConvId) {
        const id = Number(targetConvId);
        loadMessages(id);
        const socket = getSocket(user?.id);
        socket.emit('conversation:join', id);

        const conv = conversations.find((c) => Number(c.id) === id);
        if (conv) {
          if (!activeConversation || Number(activeConversation.id) !== id) {
            selectConversation(conv);
          }
        } else if (!activeConversation || Number(activeConversation.id) !== id) {
          selectConversation({
            id,
            type: 'direct',
            title: _route?.params?.title || 'Chat',
          } as any);
        }
      }

      // Fast sync timer while focused to guarantee incoming document appearance
      const syncInterval = setInterval(() => {
        if (targetConvId) {
          loadMessages(Number(targetConvId));
        }
      }, 4000);

      return () => {
        clearInterval(syncInterval);
      };
    }, [targetConvId, activeConversation, conversations, loadMessages, selectConversation, setupSocketListeners, user?.id, _route?.params?.title])
  );

  const handleRefresh = async () => {
    if (!targetConvId) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadMessages(Number(targetConvId)),
        loadConversations(false),
        useAuthStore.getState().refreshPermissions(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    return () => {
      leaveActiveConversation();
    };
  }, [leaveActiveConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  if (!activeConversation) {
    return null;
  }

  const isGroup = (activeConversation.type || '').toLowerCase() === 'group';
  const isActivity = Boolean(activeConversation.is_activity) || activeConversation.title === '#activity';
  const isMaster = Boolean(activeConversation.is_master) && !isActivity;
  const isAnnouncement = Boolean(activeConversation.is_announcement);
  const matchedConv = conversations.find((c) => Number(c.id) === Number(activeConversation.id));
  const messagePartnerId = messages.find(
    (m) => m.sender_id && Number(m.sender_id) !== Number(user?.id)
  )?.sender_id;

  const pId =
    (activeConversation as any).partnerId ||
    (activeConversation as any).other_user_id ||
    (activeConversation as any).partner_id ||
    (matchedConv as any)?.partnerId ||
    (matchedConv as any)?.other_user_id ||
    (matchedConv as any)?.partner_id ||
    messagePartnerId;

  const isOnline = !isGroup && pId ? onlineUserIds.some((id) => String(id) === String(pId)) : false;

  const isGroupAdmin =
    user?.role === 'admin' ||
    user?.username === 'admin' ||
    Number(activeConversation.created_by) === Number(user?.id) ||
    activeConversation.member_role === 'ADMIN';

  const whoCanPost = activeConversation.who_can_post || (isAnnouncement ? 'ADMIN_ONLY' : 'ALL_MEMBERS');
  const hasGroupWriteAccess =
    !isGroup ||
    isActivity ||
    isGroupAdmin ||
    (whoCanPost === 'ALL_MEMBERS' && !isAnnouncement) ||
    (whoCanPost === 'SELECTED_MEMBERS' && (Boolean(activeConversation.can_post) || isGroupAdmin));

  const hasWriteAccess = permissions.canChat && hasGroupWriteAccess;

  const initiateVoiceCall = () => {
    if (!pId) {
      Alert.alert('Cannot Start Call', 'User details could not be found for this contact.');
      return;
    }
    startCall({
      toUserId: pId,
      peerInfo: {
        name: title,
        avatar:
          (activeConversation as any)?.profile_photo ||
          (activeConversation as any)?.avatar ||
          (matchedConv as any)?.profile_photo ||
          (matchedConv as any)?.avatar ||
          '',
      },
      type: 'audio',
    });
  };

  const handleStartVoiceCall = () => {
    if (callStatus === 'CALLING' || callStatus === 'CONNECTING' || callStatus === 'CONNECTED') {
      Alert.alert(
        'Call in Progress',
        'You have an ongoing call session. Would you like to end it and start this call?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End & Call',
            style: 'destructive',
            onPress: () => {
              endCall(true);
              setTimeout(() => {
                cleanupCall();
                initiateVoiceCall();
              }, 400);
            },
          },
        ]
      );
      return;
    }
    initiateVoiceCall();
  };

  const initiateVideoCall = () => {
    if (!pId) {
      Alert.alert('Cannot Start Call', 'User details could not be found for this contact.');
      return;
    }
    startCall({
      toUserId: pId,
      peerInfo: {
        name: title,
        avatar:
          (activeConversation as any)?.profile_photo ||
          (activeConversation as any)?.avatar ||
          (matchedConv as any)?.profile_photo ||
          (matchedConv as any)?.avatar ||
          '',
      },
      type: 'video',
    });
  };

  const handleStartVideoCall = () => {
    if (callStatus === 'CALLING' || callStatus === 'CONNECTING' || callStatus === 'CONNECTED') {
      Alert.alert(
        'Call in Progress',
        'You have an ongoing call session. Would you like to end it and start this call?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End & Call',
            style: 'destructive',
            onPress: () => {
              endCall(true);
              setTimeout(() => {
                cleanupCall();
                initiateVideoCall();
              }, 400);
            },
          },
        ]
      );
      return;
    }
    initiateVideoCall();
  };

  const handleSend = async (text: string, file: FileUploadAsset | null) => {
    let attachmentId: number | null = null;

    try {
      if (file) {
        setIsUploading(true);
        const uploadRes = await uploadChatAttachment(file);
        attachmentId = uploadRes.data?.attachmentId || uploadRes.data?.id;
        setSelectedFile(null);
      }

      await sendMessage({
        messageText: text,
        parentMessageId: replyingTo?.id || null,
        attachmentId,
      });

      setReplyingTo(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Send Failed', err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate('MainTabs');
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to permanently delete "${activeConversation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupChat(activeConversation.id);
              await loadConversations(false);
              handleGoBack();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMessage = (msg: ChatMessage) => {
    const isSelf = Number(msg.sender_id) === Number(user?.id);
    const canDeleteForEveryone = isAdmin || isSelf;

    if (canDeleteForEveryone) {
      // Admin (for both sender & receiver sides) OR sender: Can choose between 'Delete for me' and 'Delete for everyone'
      const options: any[] = [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for me',
          onPress: async () => {
            try {
              await deleteMessage(msg.id, 'FOR_ME');
              useChatStore.setState((state) => ({
                messages: state.messages.filter((m) => m.id !== msg.id),
              }));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete message.');
            }
          },
        },
        {
          text: 'Delete for everyone',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(msg.id, 'FOR_EVERYONE');
              useChatStore.setState((state) => ({
                messages: state.messages.filter((m) => m.id !== msg.id),
              }));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete message.');
            }
          },
        },
      ];

      Alert.alert(
        'Delete Message',
        'Who do you want to delete this message for?',
        options
      );
    } else {
      // Receiver side for regular user: Only show 'Delete for me'
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message for yourself?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete for me',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMessage(msg.id, 'FOR_ME');
                useChatStore.setState((state) => ({
                  messages: state.messages.filter((m) => m.id !== msg.id),
                }));
              } catch (err: any) {
                Alert.alert('Error', err.response?.data?.message || 'Failed to delete message.');
              }
            },
          },
        ]
      );
    }
  };

  const handleViewFile = (file: any) => {
    navigation.navigate('FileViewer', { file });
  };

  const title = isActivity
    ? 'activity'
    : activeConversation.displayTitle || activeConversation.title || (isGroup ? 'Group Chat' : 'Direct Message');

  const subtitle = isActivity
    ? 'Company announcements & updates'
    : isGroup
    ? activeConversation.department_name
      ? `🏢 ${activeConversation.department_name}`
      : 'Team channel'
    : isOnline
    ? 'Active now'
    : 'Offline';

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  return (
    <View style={styles.container}>
      {/* Thread Header */}
      <View style={[styles.header, { paddingTop: topInset + 6 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleGoBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeftIcon size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <AppAvatar
            name={title}
            size={38}
            isActivity={isActivity}
            isBroadcast={isMaster || isAnnouncement}
            isGroup={isGroup}
            isOnline={isOnline}
            showPresence={!isGroup}
          />

          <View style={styles.headerMeta}>
            <View style={styles.headerTitleRow}>
              {isActivity && <Text style={styles.hashPrefix}>#</Text>}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, isOnline && styles.headerSubtitleOnline]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {!isGroup && Boolean(pId) && !isActivity && !isMaster && (
            <>
              {/* Voice Call Button */}
              <TouchableOpacity
                style={[
                  styles.callBtn,
                  isOnline ? styles.callBtnVoiceActive : styles.callBtnOffline,
                ]}
                onPress={handleStartVoiceCall}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              >
                <PhoneIcon
                  size={17}
                  color={isOnline ? '#059669' : colors.textMuted}
                />
              </TouchableOpacity>

              {/* Video Call Button */}
              <TouchableOpacity
                style={[
                  styles.callBtn,
                  isOnline ? styles.callBtnVideoActive : styles.callBtnOffline,
                ]}
                onPress={handleStartVideoCall}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              >
                <VideoIcon
                  size={17}
                  color={isOnline ? '#2563EB' : colors.textMuted}
                />
              </TouchableOpacity>
            </>
          )}

          {isGroup && !isActivity && isGroupAdmin && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteGroup}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <TrashIcon size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages Thread */}
      <KeyboardAvoidingView
        style={styles.threadContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSelf = Number(item.sender_id) === Number(user?.id);
            return (
              <MessageBubble
                message={item}
                isSelf={isSelf}
                showSenderName={isGroup && !isSelf}
                onViewFile={handleViewFile}
                onReply={(msg) => setReplyingTo(msg)}
                onDelete={handleDeleteMessage}
              />
            );
          }}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: spacing.md },
          ]}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />

        {/* Real-time typing bubble */}
        <TypingIndicator
          typingUsers={typingUsers}
          conversationId={activeConversation.id}
        />

        {/* Composer Bar */}
        <ChatInputBar
          onSend={handleSend}
          onOpenAttachmentModal={() => setIsAttachmentModalOpen(true)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          selectedFile={selectedFile}
          onRemoveFile={() => setSelectedFile(null)}
          isUploading={isUploading}
          hasWriteAccess={hasWriteAccess}
          onTypingStart={emitTypingStart}
          onTypingStop={emitTypingStop}
        />
      </KeyboardAvoidingView>

      {/* Attachment Bottom Sheet */}
      <AttachmentPickerModal
        visible={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onSelectFile={(file) => setSelectedFile(file)}
        canCamera={permissions.canCamera}
        canUpload={permissions.canUpload}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashPrefix: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
    color: '#d97706',
    marginRight: 2,
  },
  headerTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerSubtitleOnline: {
    color: colors.success,
    fontWeight: fontWeights.semibold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 10,
    elevation: 10,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 20,
    elevation: 20,
  },
  callBtnVoiceActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  callBtnVideoActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  callBtnOffline: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
  },
  callBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadContainer: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
});
