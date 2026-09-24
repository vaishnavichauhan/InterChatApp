import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppAvatar } from '../../components/common/AppAvatar';
import { ArrowLeftIcon, TrashIcon } from '../../components/icons/SvgIcons';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { AttachmentPickerModal } from '../../components/chat/AttachmentPickerModal';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { uploadChatAttachment, deleteGroupChat, FileUploadAsset } from '../../api/chatApi';

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

  const {
    activeConversation,
    messages,
    sendMessage,
    onlineUserIds,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    leaveActiveConversation,
    loadConversations,
  } = useChatStore();

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileUploadAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  const flatListRef = useRef<FlatList>(null);

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

  if (!activeConversation) {
    return null;
  }

  const isGroup = (activeConversation.type || '').toLowerCase() === 'group';
  const isActivity = Boolean(activeConversation.is_activity) || activeConversation.title === '#activity';
  const isMaster = Boolean(activeConversation.is_master) && !isActivity;
  const isAnnouncement = Boolean(activeConversation.is_announcement);
  const isOnline = activeConversation.partnerId ? onlineUserIds.includes(String(activeConversation.partnerId)) : false;

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
    } catch (err: any) {
      Alert.alert('Send Failed', err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsUploading(false);
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
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete group.');
            }
          },
        },
      ]
    );
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
            onPress={() => navigation.goBack()}
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

      {/* Messages Thread */}
      <KeyboardAvoidingView
        style={styles.threadContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              />
            );
          }}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: spacing.md },
          ]}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
