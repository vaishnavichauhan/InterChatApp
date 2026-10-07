import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert, Platform } from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { formatMessageTime, formatFileSize, getFileCategory } from '../../utils/formatters';
import {
  FileIcon,
  CameraIcon,
  DownloadIcon,
  LockIcon,
  EyeIcon,
  TrashIcon,
  ReplyIcon,
  BanIcon,
  PhoneIcon,
  VideoIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  PhoneMissedIcon,
} from '../icons/SvgIcons';
import { ChatMessage } from '../../store/chatStore';
import { resolveFileUrl } from '../../config/api';
import { useAuthStore, isDeviceDownloadAllowed, isUserAdminRole } from '../../store/authStore';
import { useCall } from '../../context/CallContext';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  showSenderName?: boolean;
  onViewFile?: (file: any) => void;
  onReply?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
}

const CallLogBubble: React.FC<{
  message: ChatMessage;
  isSelf: boolean;
}> = ({ message, isSelf }) => {
  const user = useAuthStore((state) => state.user);
  const { startCall } = useCall();

  let callData: any = null;
  try {
    const rawContent = (message as any).content || message.message_text;
    if (typeof rawContent === 'string' && rawContent.startsWith('{')) {
      callData = JSON.parse(rawContent);
    }
  } catch {}

  const callerId = callData?.callerId || message.sender_id;
  const isCaller = Number(callerId) === Number(user?.id);
  const status = callData?.status || 'completed';
  const callType = (callData?.callType || 'audio').toLowerCase() as 'audio' | 'video';
  const duration = parseInt(callData?.duration, 10) || 0;
  const isVideo = callType === 'video';

  const formatCallDur = (s: number) => {
    if (!s || s <= 0) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(sec)}`;
  };

  let title = '';
  let subtitle = '';
  let iconColor = '#10b981';
  let badgeBg = '#ecfdf5';
  let isMissed = false;

  if (status === 'completed') {
    if (isCaller) {
      title = isVideo ? 'Outgoing Video Call' : 'Outgoing Voice Call';
      subtitle = formatCallDur(duration) ? `Duration: ${formatCallDur(duration)}` : 'Answered';
      iconColor = '#10b981';
      badgeBg = '#ecfdf5';
    } else {
      title = isVideo ? 'Incoming Video Call' : 'Incoming Voice Call';
      subtitle = formatCallDur(duration) ? `Duration: ${formatCallDur(duration)}` : 'Answered';
      iconColor = '#10b981';
      badgeBg = '#ecfdf5';
    }
  } else if (status === 'declined') {
    title = isVideo ? 'Declined Video Call' : 'Declined Voice Call';
    subtitle = isCaller ? 'Call declined' : 'Declined';
    iconColor = '#ef4444';
    badgeBg = '#fef2f2';
    isMissed = true;
  } else {
    // missed / busy / cancelled
    if (!isCaller) {
      title = isVideo ? 'Missed Video Call' : 'Missed Voice Call';
      subtitle = 'Missed call';
      iconColor = '#ef4444';
      badgeBg = '#fef2f2';
      isMissed = true;
    } else {
      title = isVideo ? 'Cancelled Video Call' : 'Cancelled Voice Call';
      subtitle = 'No answer';
      iconColor = '#64748b';
      badgeBg = '#f1f5f9';
    }
  }

  const partnerTargetId = isCaller ? callData?.receiverId : callerId;

  const handleCallBack = () => {
    if (partnerTargetId) {
      startCall({
        toUserId: partnerTargetId,
        peerInfo: {
          name: message.sender_name || message.sender_username || 'User',
        },
        type: isVideo ? 'video' : 'audio',
      });
    }
  };

  return (
    <View style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}>
      <View
        style={[
          styles.callLogCard,
          isSelf ? styles.callLogCardSelf : styles.callLogCardOther,
          isMissed && styles.callLogCardMissed,
        ]}
      >
        <View style={styles.callMainRow}>
          {/* Left: Call Icon Badge */}
          <View style={[styles.callIconBadge, { backgroundColor: badgeBg }]}>
            {isMissed ? (
              <PhoneMissedIcon size={20} color={iconColor} />
            ) : isCaller ? (
              <PhoneOutgoingIcon size={20} color={iconColor} />
            ) : (
              <PhoneIncomingIcon size={20} color={iconColor} />
            )}
          </View>

          {/* Center: Title & Duration / Status */}
          <View style={styles.callDetails}>
            <Text style={[styles.callTitle, isMissed && styles.callTitleMissed]} numberOfLines={1}>
              {title}
            </Text>

            {Boolean(subtitle) && (
              <Text style={[styles.callSubtitle, isMissed && styles.callSubtitleMissed]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Corner: Timestamp */}
        <View style={styles.callTimeRow}>
          <Text style={styles.callTimeText}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>

        {/* Right: Quick Call Back Button */}
        {/* {Boolean(partnerTargetId) && (
          <TouchableOpacity
            style={[styles.callActionBtn, isMissed && styles.callActionBtnMissed]}
            onPress={handleCallBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isVideo ? (
              <VideoIcon size={16} color={isMissed ? '#ef4444' : '#10b981'} />
            ) : (
              <PhoneIcon size={16} color={isMissed ? '#ef4444' : '#10b981'} />
            )}
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  showSenderName = false,
  onViewFile,
  onReply,
  onDelete,
}) => {
  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // If this is a call log, delegate to CallLogBubble
  if (message.message_type === 'CALL') {
    return <CallLogBubble message={message} isSelf={isSelf} />;
  }

  const isAdmin = isUserAdminRole(user);
  const canDelete = Boolean(user);

  const canDownload = Boolean(permissions.canDownload && isDeviceDownloadAllowed(user));
  const canView = permissions.canView !== false;

  const rawAtt = (Array.isArray(message.attachments) && message.attachments.length > 0)
    ? message.attachments[0]
    : null;
  const attId = rawAtt?.id || rawAtt?.attachmentId || message.attachment_id || message.attachmentId;
  const attName = rawAtt?.original_name || rawAtt?.file_name || message.original_name || message.file_name || (message.message_type === 'FILE' ? 'Document' : '');
  const attMime = rawAtt?.mime_type || rawAtt?.file_type || message.mime_type || message.file_type || '';
  const attSize = rawAtt?.file_size || message.file_size || 0;

  const hasAttachment = Boolean(
    attId ||
    attName ||
    message.message_type === 'FILE' ||
    message.message_type === 'IMAGE' ||
    message.message_type === 'VIDEO'
  );

  const attachment = hasAttachment ? {
    id: attId || message.id,
    original_name: attName || 'Document',
    file_size: attSize,
    mime_type: attMime,
  } : null;

  const fileCategory = attachment ? getFileCategory(attachment.original_name, attachment.mime_type) : null;
  const isImage = fileCategory === 'image';
  const fileId = attachment?.id;

  const fileCategoryLabel = (
    fileCategory && fileCategory !== 'unknown'
      ? fileCategory
      : (attachment?.original_name?.split('.').pop() || 'File')
  ).toUpperCase();

  const imageUrl = fileId && isImage && token
    ? resolveFileUrl(`/api/chat/files/${fileId}/view?token=${encodeURIComponent(token)}`)
    : null;

  const handleView = () => {
    if (!canView) {
      Alert.alert('View Restricted', 'You do not have permission to view documents in-app.');
      return;
    }
    if (onViewFile && attachment) {
      onViewFile(attachment);
    }
  };

  const handleDownload = async (att: any) => {
    if (!canDownload) {
      Alert.alert('Download Restricted', 'Your account or device policy restricts downloading files.');
      return;
    }
    const id = att?.id || att?.attachmentId;
    if (!id) return;
    const downloadUrl = resolveFileUrl(`/api/chat/files/${id}/download?token=${encodeURIComponent(token || '')}`);
    try {
      await Linking.openURL(downloadUrl);
    } catch (err) {
      console.warn('Could not open download url', err);
      Alert.alert('Download Error', 'Could not initiate file download.');
    }
  };

  const isRestricted = Boolean(message.is_attachment_restricted);
  const isDeleted = message.message_text === 'This message was deleted' || (message as any).is_deleted;

  const renderActions = () => {
    if (!isHovered || isDeleted) return null;
    return (
      <View style={[styles.actionsContainer, isSelf ? styles.actionsContainerSelf : styles.actionsContainerOther]}>
        {onReply && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsHovered(false); onReply(message); }}>
            <ReplyIcon size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {canDelete && onDelete && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsHovered(false); onDelete(message); }}>
            <TrashIcon size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View
      {...Platform.select({
        web: {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any
      })}
      style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}
    >
      {!isSelf && renderActions()}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.touchableBubble, isSelf ? styles.touchableBubbleSelf : styles.touchableBubbleOther]}
        onLongPress={() => {
           setIsHovered(!isHovered);
           onReply && onReply(message);
        }}
        onPress={() => Platform.OS !== 'web' && setIsHovered(!isHovered)}
      >
        {isDeleted ? (
          <View style={styles.bubbleDeleted}>
            <View style={styles.deletedContainer}>
              <BanIcon size={14} color={colors.textMuted} />
              <Text style={styles.deletedText}>This message was deleted</Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatMessageTime(message.created_at)}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.bubble,
              isSelf ? styles.bubbleSelf : styles.bubbleOther,
              (Boolean(attachment) || isRestricted) && styles.bubbleWithAttachment,
              Boolean(message.parent_message_text || message.parent_message_id) && styles.bubbleWithReply,
            ]}
          >
            {/* Sender Name in group chats for others */}
        {!isSelf && showSenderName && (
          <Text style={[styles.senderName, Boolean(attachment) && styles.senderNameWithAttachment]}>
            {message.sender_name || message.sender_username || 'Colleague'}
          </Text>
        )}

        {/* Reply Quote Banner */}
        {(message.parent_message_text || message.parent_message_id) && (
          <View
            style={[
              styles.replyQuote,
              isSelf ? styles.replyQuoteSelf : styles.replyQuoteOther,
              Boolean(attachment) && styles.replyQuoteWithAttachment,
            ]}
          >
            <Text style={[styles.replySender, isSelf && styles.replySenderSelf]} numberOfLines={1}>
              {message.parent_sender_name ? `Replying to ${message.parent_sender_name}` : 'Replying:'}
            </Text>
            <Text style={[styles.replyText, isSelf && styles.replyTextSelf]} numberOfLines={2}>
              {message.parent_message_text || 'Original message'}
            </Text>
          </View>
        )}

        {/* Attachment Item: Image Preview or File Card with View, Download & Time */}
        {attachment ? (
          <TouchableOpacity
            style={[
              styles.attachmentCard,
              isSelf ? styles.attachmentCardSelf : styles.attachmentCardOther,
            ]}
            onPress={handleView}
            activeOpacity={0.88}
          >
            {/* Image Preview Banner if Image */}
            {isImage && imageUrl && !imageError && (
              <View style={styles.imageBannerContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.imageBanner}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              </View>
            )}

            {/* Inner Content Area */}
            <View style={styles.attachmentBody}>
              {/* Row 1: Icon + Name & Details */}
              <View style={styles.attachmentHeaderRow}>
                {/* 1. Icon */}
                <View style={styles.attachmentIconWrap}>
                  {isImage ? (
                    <CameraIcon size={18} color={colors.primary} />
                  ) : (
                    <FileIcon size={18} color={colors.primary} />
                  )}
                </View>

                {/* 2. Name & 3. Details */}
                <View style={styles.attachmentTextColumn}>
                  <Text
                    style={styles.attachmentName}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {attachment.original_name || 'Attachment'}
                  </Text>
                  <Text style={styles.attachmentSize}>
                    {formatFileSize(attachment.file_size)} • {fileCategoryLabel}
                  </Text>
                </View>
              </View>

              {/* Row 2: 4. View + 5. Download Icon on Left | 6. Time on Right */}
              <View style={styles.attachmentFooterRow}>
                {/* Action buttons (View & Download) */}
                <View style={styles.attachmentActionsWrap}>
                  {canView && (
                    <TouchableOpacity
                      style={styles.viewPillBtn}
                      onPress={handleView}
                      activeOpacity={0.75}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <EyeIcon size={12} color={colors.primary} />
                      <Text style={styles.viewPillText}>
                        View
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canDownload && (
                    <TouchableOpacity
                      style={styles.docDownloadBtn}
                      onPress={() => handleDownload(attachment)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <DownloadIcon size={13} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 6. Time inside card */}
                <Text style={styles.cardTimeText}>
                  {formatMessageTime(message.created_at)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : isRestricted ? (
          /* Restricted Attachment Placeholder */
          <View
            style={[
              styles.restrictedCard,
              isSelf ? styles.restrictedCardSelf : styles.restrictedCardOther,
            ]}
          >
            <View style={[styles.restrictedIconWrap, isSelf ? styles.restrictedIconWrapSelf : styles.restrictedIconWrapOther]}>
              <LockIcon size={16} color={isSelf ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.restrictedTextWrap}>
              <Text style={styles.restrictedTitle}>
                Attachment Hidden
              </Text>
              <Text style={styles.restrictedSubtitle}>
                Viewing restricted by policy
              </Text>
            </View>
            <Text style={styles.cardTimeText}>
              {formatMessageTime(message.created_at)}
            </Text>
          </View>
        ) : null}

        {/* Message Caption (if accompanying text was sent with attachment) */}
        {Boolean(message.message_text) && (
          <View style={Boolean(attachment) ? styles.captionContainer : null}>
            <Text
              style={[
                styles.messageText,
                isSelf && !attachment ? styles.messageTextSelf : styles.messageTextOther,
                Boolean(attachment) && styles.messageTextWithAttachment,
              ]}
            >
              {message.message_text}
            </Text>
            {/* If there is caption text, show its timestamp below the caption */}
            <View style={[styles.timeRow, Boolean(attachment) && styles.timeRowWithAttachment]}>
              <Text
                style={[
                  styles.timeText,
                  isSelf && !attachment ? styles.timeTextSelf : styles.timeTextOther,
                  Boolean(attachment) && styles.timeTextWithAttachment,
                ]}
              >
                {formatMessageTime(message.created_at)}
              </Text>
            </View>
          </View>
        )}

        {/* Timestamp for text-only messages (when no attachment and no text) */}
        {!attachment && !isRestricted && !message.message_text && (
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isSelf ? styles.timeTextSelf : styles.timeTextOther]}>
              {formatMessageTime(message.created_at)}
            </Text>
          </View>
        )}
          </View>
        )}
      </TouchableOpacity>
      {isSelf && renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  containerSelf: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  touchableBubble: {
    maxWidth: '84%',
  },
  touchableBubbleSelf: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  touchableBubbleOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginHorizontal: 8,
    gap: 8,
  },
  actionsContainerSelf: {
    marginRight: 0,
  },
  actionsContainerOther: {
    marginLeft: 0,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  bubble: {
    minWidth: 125,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 7,
    borderRadius: borderRadius.lg,
  },
  bubbleWithReply: {
    minWidth: 200,
  },
  bubbleWithAttachment: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 245,
    maxWidth: 300,
  },
  bubbleSelf: {
    backgroundColor: colors.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingTop: spacing.sm,
    paddingBottom: 7,
    paddingHorizontal: spacing.md,
    minWidth: 160,
  },
  deletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deletedText: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  senderName: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
    marginBottom: 3,
  },
  senderNameWithAttachment: {
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 2,
  },
  replyQuote: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    marginBottom: spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
  },
  replyQuoteWithAttachment: {
    marginHorizontal: 3,
    marginBottom: 4,
  },
  replyQuoteSelf: {
    borderLeftColor: colors.primaryLight,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  replyQuoteOther: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceSubtle,
  },
  replySender: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  replySenderSelf: {
    color: '#ffffff',
  },
  replyText: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
  },
  replyTextSelf: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  /* ── Attachment Card with In-App Preview & View Button ── */
  attachmentCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
  },
  attachmentCardSelf: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryMuted,
    borderBottomRightRadius: 4,
  },
  attachmentCardOther: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  imageBannerContainer: {
    width: '100%',
    height: 165,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  imageBanner: {
    width: '100%',
    height: '100%',
  },
  attachmentBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 7,
  },
  attachmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.primarySubtle,
  },
  attachmentTextColumn: {
    flex: 1,
    marginLeft: 9,
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    color: '#0f172a',
    lineHeight: 17,
  },
  attachmentSize: {
    fontSize: 10.5,
    fontWeight: fontWeights.medium,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  attachmentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
  },
  attachmentActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 6,
    gap: 4,
    backgroundColor: colors.primarySubtle,
    borderWidth: 0.5,
    borderColor: colors.primaryMuted,
  },
  viewPillText: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
  },
  docDownloadBtn: {
    width: 25,
    height: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySubtle,
    borderWidth: 0.5,
    borderColor: colors.primaryMuted,
  },
  cardTimeText: {
    fontSize: 9.5,
    fontWeight: fontWeights.medium,
    marginLeft: 'auto',
    paddingLeft: 6,
    flexShrink: 0,
    color: '#94a3b8',
  },
  captionContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },

  /* ── Restricted Attachment Placeholder Card ── */
  restrictedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    width: '100%',
    minWidth: 200,
    maxWidth: 260,
    borderWidth: 1,
  },
  restrictedCardSelf: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryMuted,
    borderBottomRightRadius: 4,
  },
  restrictedCardOther: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  restrictedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  restrictedIconWrapSelf: {
    backgroundColor: colors.primarySubtle,
  },
  restrictedIconWrapOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  restrictedTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  restrictedTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  restrictedSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },

  /* ── Message Text & Timestamp ── */
  messageText: {
    fontSize: fontSizes.base,
    lineHeight: 21,
    fontWeight: fontWeights.regular,
    includeFontPadding: false,
  },
  messageTextWithAttachment: {
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 2,
  },
  messageTextSelf: {
    color: colors.bubbleSentText,
  },
  messageTextOther: {
    color: colors.bubbleReceivedText,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeRowWithAttachment: {
    paddingHorizontal: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
    includeFontPadding: false,
  },
  timeTextWithAttachment: {},
  timeTextSelf: {
    color: colors.bubbleSentTime,
  },
  timeTextOther: {
    color: colors.bubbleReceivedTime,
  },

  /* ── Call Log Message Styles ── */
  callLogCard: {
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: 200,
    maxWidth: 270,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  callLogCardSelf: {
    borderBottomRightRadius: 4,
  },
  callLogCardOther: {
    borderBottomLeftRadius: 4,
  },
  callLogCardMissed: {
    borderColor: '#fee2e2',
  },
  callMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  callTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  callTitleMissed: {
    color: '#ef4444',
  },
  callSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  callSubtitleMissed: {
    color: '#f87171',
  },
  callTimeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  callTimeText: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    color: '#94a3b8',
  },
  callActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  callActionBtnMissed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
});
