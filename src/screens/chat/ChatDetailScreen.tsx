import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { AppAvatar } from '../../components/common/AppAvatar';
import {
  ArrowLeftIcon,
  TrashIcon,
  PhoneIcon,
  VideoIcon,
  InfoIcon,
  SettingsIcon,
  CheckIcon,
  CloseIcon,
  UsersIcon,
  LockIcon,
  MessagesSquareIcon,
  SearchIcon,
} from '../../components/icons/SvgIcons';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { AttachmentPickerModal } from '../../components/chat/AttachmentPickerModal';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useAuthStore, isUserAdminRole } from '../../store/authStore';
import {
  uploadChatAttachment,
  deleteGroupChat,
  deleteMessage,
  FileUploadAsset,
  updateGroupSettings,
  getGroupMembers,
} from '../../api/chatApi';
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
    isLoadingMessages,
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

  // Group info & settings modal state
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [groupTitleEdit, setGroupTitleEdit] = useState('');
  const [groupWhoCanPostEdit, setGroupWhoCanPostEdit] = useState<'ALL_MEMBERS' | 'SELECTED_MEMBERS' | 'ADMIN_ONLY'>('ALL_MEMBERS');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [allowedMemberIdsEdit, setAllowedMemberIdsEdit] = useState<number[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const filteredGroupMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return groupMembers;
    const q = memberSearchQuery.toLowerCase();
    return groupMembers.filter((m: any) =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.username && m.username.toLowerCase().includes(q))
    );
  }, [groupMembers, memberSearchQuery]);

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

  const handleOpenGroupInfo = async () => {
    if (!activeConversation) return;
    setGroupTitleEdit(activeConversation.title || '');
    setGroupWhoCanPostEdit((activeConversation.who_can_post as any) || 'ALL_MEMBERS');
    setMemberSearchQuery('');
    setIsGroupInfoModalOpen(true);
    try {
      setIsLoadingMembers(true);
      const res = await getGroupMembers(activeConversation.id);
      const members = res?.members || res?.data || (Array.isArray(res) ? res : []);
      const validMembers = Array.isArray(members) ? members : [];
      setGroupMembers(validMembers);
      const posters = validMembers
        .filter((m: any) => Boolean(m.can_post))
        .map((m: any) => Number(m.id || m.user_id));
      setAllowedMemberIdsEdit(posters);
    } catch (err) {
      console.warn('Failed to load group members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const toggleMemberPosting = (memberId: number) => {
    if (allowedMemberIdsEdit.includes(memberId)) {
      setAllowedMemberIdsEdit(allowedMemberIdsEdit.filter((id) => id !== memberId));
    } else {
      setAllowedMemberIdsEdit([...allowedMemberIdsEdit, memberId]);
    }
  };

  const handleAllowAllMembers = () => {
    const allIds = groupMembers.map((m: any) => Number(m.id || m.user_id));
    setAllowedMemberIdsEdit(allIds);
  };

  const handleAdminsOnlyMembers = () => {
    setAllowedMemberIdsEdit([]);
  };

  const handleSaveGroupSettings = async () => {
    if (!activeConversation) return;
    if (!groupTitleEdit.trim()) {
      Alert.alert('Title Required', 'Please enter a group title.');
      return;
    }
    try {
      setIsSavingSettings(true);
      await updateGroupSettings(activeConversation.id, {
        title: groupTitleEdit.trim(),
        whoCanPost: groupWhoCanPostEdit,
        who_can_post: groupWhoCanPostEdit,
        allowed_member_ids:
          groupWhoCanPostEdit === 'SELECTED_MEMBERS' ? allowedMemberIdsEdit : [],
      });
      await loadConversations(false);
      selectConversation({
        ...activeConversation,
        title: groupTitleEdit.trim(),
        who_can_post: groupWhoCanPostEdit,
      });
      setIsGroupInfoModalOpen(false);
      Alert.alert('Success', 'Group settings updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update group settings.');
    } finally {
      setIsSavingSettings(false);
    }
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
    ? activeConversation.company_name
      ? `🏛️ ${activeConversation.company_name}${activeConversation.department_name ? ` • 🏢 ${activeConversation.department_name}` : ''}`
      : activeConversation.department_name
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
              style={styles.infoBtn}
              onPress={handleOpenGroupInfo}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SettingsIcon size={19} color="#64748b" />
            </TouchableOpacity>
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
          ListEmptyComponent={
            isLoadingMessages ? (
              <View style={styles.emptyThreadContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.emptyThreadSub}>Loading messages...</Text>
              </View>
            ) : (
              <View style={styles.emptyThreadContainer}>
                <View style={styles.emptyThreadIconBox}>
                  <MessagesSquareIcon size={28} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyThreadTitle}>No messages yet</Text>
                <Text style={styles.emptyThreadSub}>
                  {isActivity
                    ? 'Company updates and announcements will appear here.'
                    : hasWriteAccess
                    ? 'Send a message to start the conversation!'
                    : 'You have read-only access to this conversation.'}
                </Text>
              </View>
            )
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

      {/* Group Info & Settings Modal */}
      <Modal
        visible={isGroupInfoModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsGroupInfoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsGroupInfoModalOpen(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Group Settings</Text>
              <TouchableOpacity
                onPress={() => setIsGroupInfoModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Group Name */}
              <View style={styles.modalFieldSection}>
                <Text style={styles.modalFieldLabel}>Group Name *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={groupTitleEdit}
                  onChangeText={setGroupTitleEdit}
                  placeholder="Enter group name"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              {/* Who Can Message? */}
              <View style={styles.modalFieldSection}>
                <Text style={styles.modalFieldLabel}>Who Can Message?</Text>
                <View style={styles.modalCapsuleRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalCapsuleCard,
                      groupWhoCanPostEdit === 'ALL_MEMBERS' && styles.modalCapsuleActive,
                    ]}
                    onPress={() => setGroupWhoCanPostEdit('ALL_MEMBERS')}
                  >
                    <Text
                      style={[
                        styles.modalCapsuleTitle,
                        groupWhoCanPostEdit === 'ALL_MEMBERS' && styles.modalCapsuleTitleActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalCapsuleCard,
                      groupWhoCanPostEdit === 'SELECTED_MEMBERS' && styles.modalCapsuleActive,
                    ]}
                    onPress={() => setGroupWhoCanPostEdit('SELECTED_MEMBERS')}
                  >
                    <Text
                      style={[
                        styles.modalCapsuleTitle,
                        groupWhoCanPostEdit === 'SELECTED_MEMBERS' && styles.modalCapsuleTitleActive,
                      ]}
                    >
                      Selected
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalCapsuleCard,
                      groupWhoCanPostEdit === 'ADMIN_ONLY' && styles.modalCapsuleActive,
                    ]}
                    onPress={() => setGroupWhoCanPostEdit('ADMIN_ONLY')}
                  >
                    <Text
                      style={[
                        styles.modalCapsuleTitle,
                        groupWhoCanPostEdit === 'ADMIN_ONLY' && styles.modalCapsuleTitleActive,
                      ]}
                    >
                      Admins Only
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Members List - Only shown when SELECTED_MEMBERS */}
              {groupWhoCanPostEdit === 'SELECTED_MEMBERS' && (
                <View style={styles.modalFieldSection}>
                  <View style={styles.memberSectionHeaderRow}>
                    <Text style={styles.modalFieldLabel}>
                      SELECT MEMBERS ({groupMembers.length})
                    </Text>
                    <View style={styles.memberQuickActionsRow}>
                      <TouchableOpacity
                        onPress={handleAllowAllMembers}
                        style={styles.quickActionBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.quickActionBtnText}>Allow All</Text>
                      </TouchableOpacity>
                      <Text style={styles.quickActionDivider}>|</Text>
                      <TouchableOpacity
                        onPress={handleAdminsOnlyMembers}
                        style={styles.quickActionBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.quickActionBtnText}>Admins Only</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Member Search Bar */}
                  <View style={styles.memberSearchContainer}>
                    <SearchIcon size={16} color={colors.textMuted} />
                    <TextInput
                      style={styles.memberSearchInput}
                      placeholder="Search members..."
                      placeholderTextColor={colors.textLight}
                      value={memberSearchQuery}
                      onChangeText={setMemberSearchQuery}
                      autoCapitalize="none"
                    />
                    {memberSearchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setMemberSearchQuery('')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <CloseIcon size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {isLoadingMembers ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                  ) : (
                    <View style={styles.membersListCard}>
                      {filteredGroupMembers.length === 0 ? (
                        <View style={styles.emptyMembersBox}>
                          <Text style={styles.emptyMembersText}>No matching members found</Text>
                        </View>
                      ) : (
                        filteredGroupMembers.map((m: any, idx: number) => {
                          const mId = Number(m.id || m.user_id);
                          const isPoster = allowedMemberIdsEdit.includes(mId);
                          const isMAdmin = m.role === 'ADMIN' || Number(activeConversation.created_by) === mId;
                          const isLast = idx === filteredGroupMembers.length - 1;
                          return (
                            <View
                              key={mId || idx}
                              style={[styles.memberRow, isLast && { borderBottomWidth: 0 }]}
                            >
                              <AppAvatar name={m.name || m.username} size={32} />
                              <View style={styles.memberMeta}>
                                <View style={styles.memberNameRow}>
                                  <Text style={styles.memberName} numberOfLines={1}>
                                    {m.name || m.username}
                                  </Text>
                                  {isMAdmin && (
                                    <View style={styles.adminRoleBadge}>
                                      <Text style={styles.adminRoleText}>Admin</Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {isMAdmin ? (
                                <View style={styles.adminPosterBadge}>
                                  <Text style={styles.adminPosterBadgeText}>Can Message</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    styles.postToggleBtn,
                                    isPoster ? styles.postToggleBtnActive : styles.postToggleBtnReadOnly,
                                  ]}
                                  onPress={() => toggleMemberPosting(mId)}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.postToggleText,
                                      isPoster ? styles.postToggleTextActive : styles.postToggleTextReadOnly,
                                    ]}
                                  >
                                    {isPoster ? 'Can Message' : 'Read Only'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons: Cancel and Save Settings */}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setIsGroupInfoModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveSettingsBtn,
                    isSavingSettings && { opacity: 0.6 },
                  ]}
                  onPress={handleSaveGroupSettings}
                  disabled={isSavingSettings}
                  activeOpacity={0.85}
                >
                  {isSavingSettings ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyThreadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    minHeight: 280,
  },
  emptyThreadIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyThreadTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyThreadSub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.extrabold,
    color: '#0f172a',
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalFieldSection: {
    marginBottom: spacing.md,
  },
  modalFieldLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#334155',
    marginBottom: spacing.xs,
  },
  modalTextInput: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: '#0f172a',
  },
  modalCapsuleRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  modalCapsuleCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCapsuleActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  modalCapsuleTitle: {
    fontSize: fontSizes.tiny + 1,
    fontWeight: fontWeights.bold,
    color: '#64748b',
  },
  modalCapsuleTitleActive: {
    color: '#2563EB',
    fontWeight: fontWeights.extrabold,
  },
  memberSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  memberQuickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  quickActionBtnText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    color: '#2563EB',
  },
  quickActionDivider: {
    fontSize: fontSizes.tiny,
    color: '#cbd5e1',
  },
  memberSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 38,
    marginBottom: spacing.sm,
    gap: 8,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#0f172a',
    paddingVertical: 0,
  },
  emptyMembersBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMembersText: {
    fontSize: fontSizes.sm,
    color: '#94a3b8',
  },
  membersListCard: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  memberMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#0f172a',
  },
  adminRoleBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminRoleText: {
    fontSize: fontSizes.tiny - 2,
    fontWeight: fontWeights.extrabold,
    color: '#d97706',
  },
  adminPosterBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminPosterBadgeText: {
    fontSize: fontSizes.tiny - 1,
    fontWeight: fontWeights.bold,
    color: '#64748b',
  },
  postToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  postToggleBtnActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  postToggleBtnReadOnly: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  postToggleText: {
    fontSize: fontSizes.tiny - 1,
    fontWeight: fontWeights.bold,
  },
  postToggleTextActive: {
    color: '#059669',
  },
  postToggleTextReadOnly: {
    color: '#64748b',
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  cancelModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#475569',
  },
  saveSettingsBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#2563EB',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSettingsBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.extrabold,
    color: '#ffffff',
  },
});
