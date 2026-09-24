import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius } from '../../theme';
import { formatMessageTime, formatFileSize, getFileCategory } from '../../utils/formatters';
import { FileIcon, CameraIcon } from '../icons/SvgIcons';
import { ChatMessage } from '../../store/chatStore';

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
  const attachment = message.attachments?.[0] || (message.attachment_id ? {
    id: message.attachment_id,
    original_name: message.original_name || 'Attachment',
    file_size: message.file_size || 0,
    mime_type: message.mime_type || '',
  } : null);

  const fileCategory = attachment ? getFileCategory(attachment.original_name, attachment.mime_type) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => onReply && onReply(message)}
      style={[styles.container, isSelf ? styles.containerSelf : styles.containerOther]}
    >
      <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
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

        {/* Attachment Card */}
        {attachment && (
          <TouchableOpacity
            style={[styles.attachmentCard, isSelf ? styles.attachmentCardSelf : styles.attachmentCardOther]}
            onPress={() => onViewFile && onViewFile(attachment)}
            activeOpacity={0.8}
          >
            <View style={styles.attachmentIcon}>
              {fileCategory === 'image' || fileCategory === 'video' ? (
                <CameraIcon size={20} color={isSelf ? colors.primary : '#ffffff'} />
              ) : (
                <FileIcon size={20} color={isSelf ? colors.primary : '#ffffff'} />
              )}
            </View>

            <View style={styles.attachmentMeta}>
              <Text
                style={[styles.attachmentName, isSelf && styles.attachmentTextSelf]}
                numberOfLines={1}
              >
                {attachment.original_name}
              </Text>
              <Text style={[styles.attachmentSize, isSelf && styles.attachmentSizeSelf]}>
                {formatFileSize(attachment.file_size)} • Tap to view
              </Text>
            </View>
          </TouchableOpacity>
        )}

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
    borderLeftColor: '#93c5fd',
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
    color: '#e0efff',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  attachmentCardSelf: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  attachmentCardOther: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  attachmentMeta: {
    flex: 1,
  },
  attachmentName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  attachmentTextSelf: {
    color: colors.textPrimary,
  },
  attachmentSize: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  attachmentSizeSelf: {
    color: colors.textMuted,
  },
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
