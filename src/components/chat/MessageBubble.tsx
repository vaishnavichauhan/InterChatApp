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
          <Text style={styles.senderName}>
            {message.sender_name || message.sender_username || 'Colleague'}
          </Text>
        )}

        {/* Reply Quote Banner */}
        {message.parent_message_text && (
          <View style={[styles.replyQuote, isSelf ? styles.replyQuoteSelf : styles.replyQuoteOther]}>
            <Text style={[styles.replySender, isSelf && styles.replySenderSelf]} numberOfLines={1}>
              {message.parent_sender_name || 'Replying to message'}
            </Text>
            <Text style={[styles.replyText, isSelf && styles.replyTextSelf]} numberOfLines={2}>
              {message.parent_message_text}
            </Text>
          </View>
        )}

        {/* Attachment Item: Image Preview or File Card with View Button */}
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

            {/* Bottom Meta Row matching Web Frontend reference */}
            <View style={styles.attachmentMetaRow}>
              {/* File Icon */}
              <View
                style={[
                  styles.attachmentIconWrap,
                  isSelf ? styles.attachmentIconWrapSelf : styles.attachmentIconWrapOther,
                ]}
              >
                {isImage ? (
                  <CameraIcon size={18} color={isSelf ? '#ffffff' : colors.primary} />
                ) : (
                  <FileIcon size={18} color={isSelf ? '#ffffff' : colors.primary} />
                )}
              </View>

              {/* Title & Subtitle */}
              <View style={styles.attachmentTextColumn}>
                <Text
                  style={[styles.attachmentName, isSelf && styles.attachmentNameSelf]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {attachment.original_name || 'Attachment'}
                </Text>
                <Text style={[styles.attachmentSize, isSelf && styles.attachmentSizeSelf]}>
                  {formatFileSize(attachment.file_size)} • In-App Preview
                </Text>
              </View>

              {/* Action Buttons: View Pill and/or Download */}
              <View style={styles.attachmentActionsRow}>
                {canView && (
                  <TouchableOpacity
                    style={[styles.viewPillBtn, isSelf ? styles.viewPillBtnSelf : styles.viewPillBtnOther]}
                    onPress={handleView}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <EyeIcon size={13} color={isSelf ? '#ffffff' : colors.primary} />
                    <Text style={[styles.viewPillText, isSelf ? styles.viewPillTextSelf : styles.viewPillTextOther]}>
                      View
                    </Text>
                  </TouchableOpacity>
                )}

                {canDownload && (
                  <TouchableOpacity
                    style={[styles.docDownloadBtn, isSelf ? styles.docDownloadBtnSelf : styles.docDownloadBtnOther]}
                    onPress={() => handleDownload(attachment)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <DownloadIcon size={14} color={isSelf ? '#ffffff' : colors.primary} />
                  </TouchableOpacity>
                )}
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
              <Text style={[styles.restrictedTitle, isSelf && styles.restrictedTitleSelf]}>
                Attachment Hidden
              </Text>
              <Text style={[styles.restrictedSubtitle, isSelf && styles.restrictedSubtitleSelf]}>
                Viewing restricted by policy
              </Text>
            </View>
          </View>
        ) : null}

        {/* Message Body */}
        {Boolean(message.message_text) && (
          <Text style={[styles.messageText, isSelf ? styles.messageTextSelf : styles.messageTextOther]}>
            {message.message_text}
          </Text>
        )}

        {/* Message Timestamp */}
        <Text style={[styles.timeText, isSelf ? styles.timeTextSelf : styles.timeTextOther]}>
          {formatMessageTime(message.created_at)}
        </Text>
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
    minWidth: 220,
    maxWidth: 270,
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
  replyQuote: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    marginBottom: spacing.xs,
    paddingVertical: 2,
    borderRadius: 2,
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
    borderRadius: borderRadius.md + 2,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    width: '100%',
    minWidth: 220,
    maxWidth: 290,
  },
  attachmentCardSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  attachmentCardOther: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  imageBannerContainer: {
    width: '100%',
    height: 155,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  imageBanner: {
    width: '100%',
    height: '100%',
  },
  attachmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs + 2,
  },
  attachmentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  attachmentIconWrapSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  attachmentIconWrapOther: {
    backgroundColor: colors.primarySubtle,
  },
  attachmentTextColumn: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 4,
  },
  attachmentName: {
    fontSize: fontSizes.xs + 0.5,
    fontWeight: fontWeights.bold,
    color: '#0f172a',
  },
  attachmentNameSelf: {
    color: '#ffffff',
  },
  attachmentSize: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: fontWeights.medium,
  },
  attachmentSizeSelf: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  attachmentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  viewPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: borderRadius.sm + 2,
    gap: 4,
  },
  viewPillBtnSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  viewPillBtnOther: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  viewPillText: {
    fontSize: 11,
    fontWeight: fontWeights.extrabold,
  },
  viewPillTextSelf: {
    color: '#ffffff',
  },
  viewPillTextOther: {
    color: colors.primary,
  },
  docDownloadBtn: {
    padding: 5,
    borderRadius: borderRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDownloadBtnSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  docDownloadBtnOther: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },

  /* ── Restricted Attachment Placeholder Card ── */
  restrictedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    width: '100%',
    minWidth: 200,
    maxWidth: 250,
  },
  restrictedCardSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  restrictedCardOther: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
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
  restrictedTitleSelf: {
    color: colors.textPrimary,
  },
  restrictedSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  restrictedSubtitleSelf: {
    color: colors.textMuted,
  },

  /* ── Message Text & Timestamp ── */
  messageText: {
    fontSize: fontSizes.base,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
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
  timeTextSelf: {
    color: colors.bubbleSentTime,
  },
  timeTextOther: {
    color: colors.bubbleReceivedTime,
  },
});
