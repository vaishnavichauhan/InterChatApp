import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { formatMessageTime, formatFileSize, getFileCategory } from '../../utils/formatters';
import { FileIcon, CameraIcon, DownloadIcon, LockIcon, EyeIcon } from '../icons/SvgIcons';
import { ChatMessage } from '../../store/chatStore';
import { resolveFileUrl } from '../../config/api';
import { useAuthStore, isDeviceDownloadAllowed } from '../../store/authStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  showSenderName?: boolean;
  onViewFile?: (file: any) => void;
  onReply?: (message: ChatMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  showSenderName = false,
  onViewFile,
  onReply,
}) => {
  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);
  const [imageError, setImageError] = useState(false);

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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => onReply && onReply(message)}
      style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}
    >
      <View
        style={[
          styles.bubble,
          isSelf ? styles.bubbleSelf : styles.bubbleOther,
          (Boolean(attachment) || isRestricted) && styles.bubbleWithAttachment,
        ]}
      >
        {/* Sender Name in group chats for others */}
        {!isSelf && showSenderName && (
          <Text style={[styles.senderName, Boolean(attachment) && styles.senderNameWithAttachment]}>
            {message.sender_name || message.sender_username || 'Colleague'}
          </Text>
        )}

        {/* Reply Quote Banner */}
        {message.parent_message_text && (
          <View
            style={[
              styles.replyQuote,
              isSelf ? styles.replyQuoteSelf : styles.replyQuoteOther,
              Boolean(attachment) && styles.replyQuoteWithAttachment,
            ]}
          >
            <Text style={[styles.replySender, isSelf && styles.replySenderSelf]} numberOfLines={1}>
              {message.parent_sender_name || 'Replying to message'}
            </Text>
            <Text style={[styles.replyText, isSelf && styles.replyTextSelf]} numberOfLines={2}>
              {message.parent_message_text}
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
        )}

        {/* Timestamp for text-only messages (when no attachment and no caption) */}
        {!attachment && !isRestricted && !message.message_text && (
          <Text style={[styles.timeText, isSelf ? styles.timeTextSelf : styles.timeTextOther]}>
            {formatMessageTime(message.created_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  containerSelf: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
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
    lineHeight: 20,
    fontWeight: fontWeights.regular,
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
  timeText: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  timeTextWithAttachment: {
    paddingHorizontal: 6,
    marginTop: 2,
    marginBottom: 1,
  },
  timeTextSelf: {
    color: colors.bubbleSentTime,
  },
  timeTextOther: {
    color: colors.bubbleReceivedTime,
  },
});
